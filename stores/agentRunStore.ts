import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { SendAgentUserInput, TerminateAgentInstance, ApproveToolInvocation } from '~/graphql/mutations/agentMutations';
import { AgentResponseSubscription } from '~/graphql/subscriptions/agent_response_subscriptions';
import type {
  SendAgentUserInputMutation,
  SendAgentUserInputMutationVariables,
  AgentResponseSubscription as AgentResponseSubscriptionType,
  AgentResponseSubscriptionVariables,
  ApproveToolInvocationMutation,
  ApproveToolInvocationMutationVariables,
  ContextFileType,
} from '~/generated/graphql';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import type { ToolCallSegment } from '~/utils/aiResponseParser/types';

/**
 * @store agentRun
 * @description This store is the "service" or "orchestration" layer for agent interactions.
 * It is responsible for all GraphQL communication (mutations, subscriptions) related to an agent run.
 * It does NOT hold agent state directly; it retrieves state from and dispatches updates to the `agentContextsStore`.
 */
export const useAgentRunStore = defineStore('agentRun', {
  // NO STATE IN THIS REFACTORED STORE
  state: () => ({}),

  // NO GETTERS IN THIS REFACTORED STORE
  getters: {},

  actions: {
    /**
     * @action sendUserInputAndSubscribe
     * @description Sends the user's input to the backend to start or continue an agent run,
     * then ensures a subscription is active to receive live updates.
     */
    async sendUserInputAndSubscribe(): Promise<void> {
      const agentContextsStore = useAgentContextsStore();
      const currentAgent = agentContextsStore.selectedAgent;

      if (!currentAgent) {
        throw new Error('No active agent selected.');
      }

      const { config, state } = currentAgent;
      const agentId = state.agentId;
      const isNewAgent = agentId.startsWith('temp-');

      if (isNewAgent && !config.llmModelName) {
        throw new Error("Please select a model for the first message.");
      }

      if (isNewAgent) {
        state.conversation.llmModelName = config.llmModelName;
        state.conversation.parseToolCalls = config.parseToolCalls;
      }

      // ** THE FIX IS HERE **
      // Instead of calling a store action, mutate the context directly.
      currentAgent.state.conversation.messages.push({
        type: 'user',
        text: currentAgent.requirement,
        timestamp: new Date(),
        contextFilePaths: currentAgent.contextFilePaths
      });
      currentAgent.state.conversation.updatedAt = new Date().toISOString();


      currentAgent.isSending = true;
      const { mutate: sendAgentUserInputMutation } = useMutation<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>(SendAgentUserInput);

      try {
        const result = await sendAgentUserInputMutation({
          input: {
            userInput: {
              content: currentAgent.requirement,
              contextFiles: currentAgent.contextFilePaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
            },
            agentId: isNewAgent ? null : agentId,
            agentDefinitionId: state.conversation.agentDefinitionId,
            workspaceId: config.workspaceId,
            llmModelName: config.llmModelName,
            autoExecuteTools: config.autoExecuteTools,
          }
        });

        const permanentAgentId = result?.data?.sendAgentUserInput?.agentId;
        if (!permanentAgentId) {
          throw new Error('Failed to send user input: No agentId returned.');
        }

        let finalAgentId = agentId;
        if (isNewAgent) {
          finalAgentId = permanentAgentId;
          agentContextsStore.promoteTemporaryAgentId(agentId, permanentAgentId);
        }
        
        const finalAgent = agentContextsStore.getAgentContextById(finalAgentId)!;
        finalAgent.requirement = '';
        finalAgent.contextFilePaths = [];

        if (!finalAgent.isSubscribed) {
          this.subscribeToAgentResponse(finalAgentId);
        }

        const conversationHistoryStore = useConversationHistoryStore();
        if (state.conversation.agentDefinitionId && conversationHistoryStore.agentDefinitionId === state.conversation.agentDefinitionId) {
           await conversationHistoryStore.fetchConversationHistory();
        }
      } catch (error) {
        console.error('Error sending user input:', error);
        currentAgent.isSending = false;
        throw error;
      }
    },

    /**
     * @action subscribeToAgentResponse
     * @description Sets up a GraphQL subscription to receive real-time events for a specific agent run.
     */
    subscribeToAgentResponse(agentId: string) {
      const agentContextsStore = useAgentContextsStore();
      const { onResult, onError, stop } = useSubscription<AgentResponseSubscriptionType, AgentResponseSubscriptionVariables>(
        AgentResponseSubscription, { agentId }
      );
      
      const agent = agentContextsStore.getAgentContextById(agentId);
      if (agent) {
        agent.isSubscribed = true;
        agent.unsubscribe = stop;
      }

      onResult(({ data }) => {
        if (!data?.agentResponse) return;
        
        const { agentId: respAgentId, data: eventData } = data.agentResponse;
        
        const agentToUpdate = agentContextsStore.getAgentContextById(respAgentId);

        if (!agentToUpdate) {
            console.warn(`Received event for unknown or closed agent with ID: ${respAgentId}. Ignoring.`);
            return;
        }

        agentToUpdate.isSending = false;

        if (eventData) {
            processAgentResponseEvent(eventData, agentToUpdate);
        }
      });

      onError((error) => {
        console.error(`Subscription error for agent ${agentId}:`, error);
        stop();
        const agentOnError = agentContextsStore.getAgentContextById(agentId);
        if(agentOnError) {
          agentOnError.isSubscribed = false;
          agentOnError.unsubscribe = undefined;
        }
      });
    },
    
    /**
     * @action postToolExecutionApproval
     * @description Sends the user's approval or denial for a tool call to the backend.
     */
    async postToolExecutionApproval(agentId: string, invocationId: string, isApproved: boolean, reason: string | null = null) {
      const { mutate: approveToolInvocationMutation } = useMutation<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>(ApproveToolInvocation);
      try {
        await approveToolInvocationMutation({ input: { agentId, invocationId, isApproved, reason }});
        
        const agentContextsStore = useAgentContextsStore();
        const agent = agentContextsStore.getAgentContextById(agentId);
        if (agent) {
          const segment = agent.state.conversation.messages
            .flatMap(m => m.type === 'ai' ? m.segments : [])
            .find(s => s.type === 'tool_call' && s.invocationId === invocationId) as ToolCallSegment | undefined;
          if (segment) {
            segment.status = isApproved ? 'executing' : 'denied';
          }
        }
      } catch (error) {
        console.error("Error posting tool execution approval:", error);
      }
    },

    /**
     * @action closeAgent
     * @description Closes an agent tab in the UI, unsubscribes from events, and optionally terminates the backend instance.
     */
    async closeAgent(agentIdToClose: string, options: { terminate: boolean }) {
      const agentContextsStore = useAgentContextsStore();
      const agentToClose = agentContextsStore.getAgentContextById(agentIdToClose);

      if (!agentToClose) return;

      if (agentToClose.unsubscribe) {
        agentToClose.unsubscribe();
        agentToClose.isSubscribed = false;
        agentToClose.unsubscribe = undefined;
      }

      agentContextsStore.removeAgentContext(agentIdToClose);
      
      if (options.terminate && !agentIdToClose.startsWith('temp-')) {
        try {
          const { mutate: terminateAgentInstanceMutation } = useMutation(TerminateAgentInstance);
          await terminateAgentInstanceMutation({ id: agentIdToClose });
        } catch (error) {
          console.error('Error closing agent on backend:', error);
        }
      }
    },

    /**
     * @action ensureAgentForLaunchProfile
     * @description Ensures that there is at least one agent context for a given launch profile.
     * Creates a new one if none exist, or attaches to a specified running agent.
     */
    ensureAgentForLaunchProfile(profileId: string, attachToAgentId?: string): void {
      const agentContextsStore = useAgentContextsStore();
      const profileState = agentContextsStore._getOrCreateCurrentProfileState();

      if (profileState.activeAgents.size === 0) {
        if (attachToAgentId) {
          agentContextsStore.createContextForExistingAgent(attachToAgentId);
          this.subscribeToAgentResponse(attachToAgentId); // Automatically subscribe when attaching
        } else {
          agentContextsStore.createNewAgentContext();
        }
      } else {
         const latestAgent = Array.from(profileState.activeAgents.values()).sort((a, b) => 
            new Date(b.state.conversation.updatedAt).getTime() - new Date(a.state.conversation.updatedAt).getTime()
         )[0];
         agentContextsStore.setSelectedAgentId(latestAgent.state.agentId);
      }
    },
  },
});
