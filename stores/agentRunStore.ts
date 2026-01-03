import { defineStore } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';
import { useRuntimeConfig } from '#app';
import { SendAgentUserInput, TerminateAgentInstance } from '~/graphql/mutations/agentMutations';
import type {
  SendAgentUserInputMutation,
  SendAgentUserInputMutationVariables,
  ContextFileType,
} from '~/generated/graphql';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { AgentStreamingService } from '~/services/agentStreaming';
import type { ToolCallSegment } from '~/types/segments';

// Maintain a map of streaming services per agent
const streamingServices = new Map<string, AgentStreamingService>();

/**
 * @store agentRun
 * @description This store is the "service" or "orchestration" layer for agent interactions.
 * It uses WebSocket streaming for real-time updates and GraphQL mutations for commands.
 */
export const useAgentRunStore = defineStore('agentRun', {
  state: () => ({}),
  getters: {},

  actions: {
    /**
     * @action sendUserInputAndSubscribe
     * @description Sends the user's input to the backend to start or continue an agent run,
     * then ensures a WebSocket connection is active to receive live updates.
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

      if (isNewAgent && !config.llmModelIdentifier) {
        throw new Error("Please select a model for the first message.");
      }

      if (isNewAgent) {
        state.conversation.llmModelIdentifier = config.llmModelIdentifier;
        state.conversation.parseToolCalls = config.parseToolCalls;
      }

      // Add the user message to the conversation
      currentAgent.state.conversation.messages.push({
        type: 'user',
        text: currentAgent.requirement,
        timestamp: new Date(),
        contextFilePaths: currentAgent.contextFilePaths
      });
      currentAgent.state.conversation.updatedAt = new Date().toISOString();

      currentAgent.isSending = true;

      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.mutate<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>({
          mutation: SendAgentUserInput,
          variables: {
            input: {
              userInput: {
                content: currentAgent.requirement,
                contextFiles: currentAgent.contextFilePaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
              },
              agentId: isNewAgent ? null : agentId,
              agentDefinitionId: state.conversation.agentDefinitionId,
              workspaceId: config.workspaceId,
              llmModelIdentifier: config.llmModelIdentifier,
              autoExecuteTools: config.autoExecuteTools,
            }
          }
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const permanentAgentId = data?.sendAgentUserInput?.agentId;
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
          this.connectToAgentStream(finalAgentId);
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
     * @action connectToAgentStream
     * @description Establishes a WebSocket connection to receive real-time events for a specific agent.
     */
    connectToAgentStream(agentId: string) {
      const agentContextsStore = useAgentContextsStore();
      const agent = agentContextsStore.getAgentContextById(agentId);
      
      if (!agent) return;

      // Get the WebSocket endpoint from runtime config (like terminal and file explorer)
      const config = useRuntimeConfig();
      const wsEndpoint = config.public.agentWsEndpoint as string || 'ws://localhost:8000/ws/agent';

      // Create streaming service for this agent
      const service = new AgentStreamingService(wsEndpoint);
      streamingServices.set(agentId, service);

      agent.isSubscribed = true;
      agent.unsubscribe = () => {
        service.disconnect();
        streamingServices.delete(agentId);
      };

      service.connect(agentId, agent);
    },
    
    /**
     * @action postToolExecutionApproval
     * @description Sends the user's approval or denial for a tool call via WebSocket.
     */
    async postToolExecutionApproval(agentId: string, invocationId: string, isApproved: boolean, _reason: string | null = null) {
      const service = streamingServices.get(agentId);
      const agentContextsStore = useAgentContextsStore();
      const agent = agentContextsStore.getAgentContextById(agentId);
      
      if (service) {
        if (isApproved) {
          service.approveTool(invocationId);
        } else {
          service.denyTool(invocationId);
        }
      }

      // Optimistically update the UI
      if (agent) {
        const segment = agent.state.conversation.messages
          .flatMap(m => m.type === 'ai' ? m.segments : [])
          .find(s => s.type === 'tool_call' && s.invocationId === invocationId) as ToolCallSegment | undefined;
        if (segment) {
          segment.status = isApproved ? 'executing' : 'denied';
        }
      }
    },

    /**
     * @action closeAgent
     * @description Closes an agent tab in the UI, disconnects WebSocket, and optionally terminates the backend instance.
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

      streamingServices.delete(agentIdToClose);
      agentContextsStore.removeAgentContext(agentIdToClose);
      
      if (options.terminate && !agentIdToClose.startsWith('temp-')) {
        try {
          const { client } = useApolloClient();
          await client.mutate({
            mutation: TerminateAgentInstance,
            variables: { id: agentIdToClose },
          });
        } catch (error) {
          console.error('Error closing agent on backend:', error);
        }
      }
    },

    /**
     * @action ensureAgentForLaunchProfile
     * @description Ensures that there is at least one agent context for a given launch profile.
     */
    ensureAgentForLaunchProfile(_profileId: string, attachToAgentId?: string): void {
      const agentContextsStore = useAgentContextsStore();
      const profileState = agentContextsStore._getOrCreateCurrentProfileState();

      if (profileState.activeAgents.size === 0) {
        if (attachToAgentId) {
          agentContextsStore.createContextForExistingAgent(attachToAgentId);
          this.connectToAgentStream(attachToAgentId);
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
