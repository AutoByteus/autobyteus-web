import { defineStore } from 'pinia';
import { getApolloClient } from '~/utils/apolloClient'
import { SendAgentUserInput, TerminateAgentInstance } from '~/graphql/mutations/agentMutations';
import type {
  SendAgentUserInputMutation,
  SendAgentUserInputMutationVariables,
  ContextFileType,
} from '~/generated/graphql';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { AgentStreamingService } from '~/services/agentStreaming';
import type { ToolInvocationLifecycle } from '~/types/segments';
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore';

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
      const currentAgent = agentContextsStore.activeInstance;

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
        const client = getApolloClient()
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
              llmConfig: config.llmConfig ?? null,
            }
          }
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const result = data?.sendAgentUserInput;
        if (!result) {
          throw new Error('Failed to send user input: No response returned.');
        }

        if (!result.success) {
          throw new Error(result.message || 'Failed to send user input.');
        }

        const permanentAgentId = result.agentId;
        if (!permanentAgentId) {
          throw new Error('Failed to send user input: No agentId returned on success.');
        }

        let finalAgentId = agentId;
        if (isNewAgent) {
          finalAgentId = permanentAgentId;
          agentContextsStore.promoteTemporaryId(agentId, permanentAgentId);
        }

        agentContextsStore.lockConfig(finalAgentId);

        const finalAgent = agentContextsStore.getInstance(finalAgentId)!;
        finalAgent.requirement = '';
        finalAgent.contextFilePaths = [];

        if (!finalAgent.isSubscribed) {
          this.connectToAgentStream(finalAgentId);
        }
      } catch (error: any) {
        console.error('Error sending user input:', error);
        currentAgent.isSending = false;

        // Push error segment to conversation
        currentAgent.state.conversation.messages.push({
          type: 'ai',
          text: 'Error Occurred',
          timestamp: new Date(),
          isComplete: true,
          segments: [{
            type: 'error',
            source: 'System',
            message: error.message || 'An unexpected error occurred.',
            details: error.toString()
          }]
        });
        currentAgent.state.conversation.updatedAt = new Date().toISOString();

        // We do NOT re-throw here because we've handled it by showing it in the UI.
        // If we re-throw, parent catch blocks might try to handle it again (e.g. log it).
      }
    },

    /**
     * @action connectToAgentStream
     * @description Establishes a WebSocket connection to receive real-time events for a specific agent.
     */
    connectToAgentStream(agentId: string) {
      const agentContextsStore = useAgentContextsStore();
      const agent = agentContextsStore.getInstance(agentId);

      if (!agent) return;

      const windowNodeContextStore = useWindowNodeContextStore();
      const wsEndpoint = windowNodeContextStore.getBoundEndpoints().agentWs;

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
      const agent = agentContextsStore.getInstance(agentId);

      if (service) {
        if (isApproved) {
          service.approveTool(invocationId, _reason || undefined);
        } else {
          service.denyTool(invocationId, _reason || undefined);
        }
      }

      // Optimistically update the UI
      if (agent) {
        const segment = agent.state.conversation.messages
          .flatMap(m => m.type === 'ai' ? m.segments : [])
          .find(s =>
            (s.type === 'tool_call' || s.type === 'write_file' || s.type === 'terminal_command') &&
            (s as ToolInvocationLifecycle).invocationId === invocationId
          ) as ToolInvocationLifecycle | undefined;
        if (segment) {
          segment.status = isApproved ? 'executing' : 'denied';
        }
      }
    },

    /**
     * @action closeAgent
     * @description Closes an agent instance in the workspace, disconnects WebSocket, and optionally terminates the backend instance.
     */
    async closeAgent(agentIdToClose: string, options: { terminate: boolean }) {
      const agentContextsStore = useAgentContextsStore();
      const agentToClose = agentContextsStore.getInstance(agentIdToClose);

      if (!agentToClose) return;

      if (agentToClose.unsubscribe) {
        agentToClose.unsubscribe();
        agentToClose.isSubscribed = false;
        agentToClose.unsubscribe = undefined;
      }

      streamingServices.delete(agentIdToClose);
      agentContextsStore.removeInstance(agentIdToClose);

      if (options.terminate && !agentIdToClose.startsWith('temp-')) {
        try {
          const client = getApolloClient()
          await client.mutate({
            mutation: TerminateAgentInstance,
            variables: { id: agentIdToClose },
          });
        } catch (error) {
          console.error('Error closing agent on backend:', error);
        }
      }
    },

  },
});
