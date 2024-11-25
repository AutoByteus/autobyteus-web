import { defineStore } from 'pinia';
import { useMutation, useSubscription, useQuery } from '@vue/apollo-composable';
import { SendStepRequirement, CloseConversation } from '~/graphql/mutations/workflowStepMutations';
import { StepResponseSubscription } from '~/graphql/subscriptions/workflowStepSubscriptions';
import { SearchContextFiles } from '~/graphql/queries/context_search_queries';
import type {
  SendStepRequirementMutation,
  SendStepRequirementMutationVariables,
  StepResponseSubscriptionVariables,
  StepResponseSubscription as StepResponseSubscriptionType,
  ContextFilePathInput,
  LlmModel,
  SearchContextFilesQuery,
  SearchContextFilesQueryVariables
} from '~/generated/graphql';
import type { Conversation, Message, ContextFilePath } from '~/types/conversation';
import apiService from '~/services/api';
import { useWorkspaceStore } from '~/stores/workspace';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useWorkflowStore } from '~/stores/workflow';
import { useTranscriptionStore } from '~/stores/transcriptionStore';

interface ConversationStoreState {
  conversations: Map<string, Conversation>;
  selectedConversationId: string | null;
  contextFilePaths: ContextFilePath[];
  isSubscribed: boolean;
  isSending: boolean;
  userRequirement: string;
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    conversations: new Map(),
    selectedConversationId: null,
    contextFilePaths: [],
    isSubscribed: false,
    isSending: false,
    userRequirement: '',
  }),

  getters: {
    activeConversations: (state) => Array.from(state.conversations.values()),
    selectedConversation: (state) =>
      state.selectedConversationId
    ? state.conversations.get(state.selectedConversationId) || null
        : null,
    currentContextPaths: (state): ContextFilePath[] => state.contextFilePaths,
    isCurrentlySending: (state): boolean => state.isSending,
    isConversationActive: (state): boolean => state.selectedConversationId !== null,
    conversationMessages: (state): Message[] =>
      state.selectedConversationId
        ? state.conversations.get(state.selectedConversationId)?.messages || []
        : [],
    currentRequirement: (state): string => state.userRequirement,
    totalCost: (state): number => {
      const conversation = state.selectedConversationId
        ? state.conversations.get(state.selectedConversationId)
        : null;
      return conversation ? (conversation.totalCost ?? 0) : 0;
    },
  },

  actions: {
    resetConversations() {
      this.conversations.clear();
      this.selectedConversationId = null;
      this.resetInputState();
    },
    addMessageToConversation(
      conversationId: string,
      message: Message,
      cost?: number
    ) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();
        if (typeof cost === 'number') {
          conversation.totalCost = cost;
        }
        this.conversations.set(conversationId, { ...conversation });
      }
    },

    resetInputState() {
      this.contextFilePaths = [];
      this.isSubscribed = false;
      this.isSending = false;
      this.userRequirement = '';
    },

    createTemporaryConversation() {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newConversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalCost: 0,
      };
      this.conversations.set(tempId, newConversation);
      this.selectedConversationId = tempId;
      this.resetInputState();
    },

    updateUserRequirement(newRequirement: string) {
      this.userRequirement = newRequirement;
    },

    setSelectedConversationId(conversationId: string | null) {
      this.selectedConversationId = conversationId;
    },

    addConversation(conversation: Conversation) {
      this.conversations.set(conversation.id, conversation);
      this.selectedConversationId = conversation.id;
    },

    async closeConversation(conversationId: string) {
      const workspaceStore = useWorkspaceStore();
      const workflowStore = useWorkflowStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
      const currentStepId = workflowStore.currentSelectedStepId;

      if (!currentWorkspaceId || !currentStepId) {
        console.error('Missing workspace ID or step ID');
        return;
      }

      try {
        const { mutate: closeConversationMutation } = useMutation(CloseConversation);

        await closeConversationMutation({
          workspaceId: currentWorkspaceId,
          stepId: currentStepId,
          conversationId
        });

        // Remove from local state
        this.conversations.delete(conversationId);
        if (this.selectedConversationId === conversationId) {
          const nextConversation = this.activeConversations[0];
          this.selectedConversationId = nextConversation?.id || null;
        }
      } catch (error) {
        console.error('Error closing conversation:', error);
        throw error;
      }
    },

    removeConversation(conversationId: string) {
      this.closeConversation(conversationId);
    },
    async sendStepRequirementAndSubscribe(
      workspaceId: string,
      stepId: string,
      requirement: string,
      llmModel?: LlmModel
    ): Promise<void> {
      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement);

      this.isSending = true;
      try {
        const formattedContextFilePaths: ContextFilePathInput[] = this.contextFilePaths.map(cf => ({
          path: cf.path,
          type: cf.type,
        }));

        const mutationVariables: SendStepRequirementMutationVariables = {
          workspaceId,
          stepId,
          contextFilePaths: formattedContextFilePaths,
          requirement: this.userRequirement,
          conversationId: this.selectedConversationId?.startsWith('temp-') ? null : this.selectedConversationId,
          llmModel: llmModel || null,
        };

        const result = await sendStepRequirementMutation(mutationVariables);

        if (result?.data?.sendStepRequirement) {
          const conversation_id = result.data.sendStepRequirement;

          if (this.selectedConversationId?.startsWith('temp-')) {
            this.conversations.delete(this.selectedConversationId);
          }

          if (!this.conversations.has(conversation_id)) {
            const newConversation: Conversation = {
              id: conversation_id,
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalCost: 0,
            };
            this.addConversation(newConversation);
          }

          // Assign cost as 0 for user message; backend handles actual cost calculation
          this.addMessageToConversation(conversation_id, {
            type: 'user',
            text: this.userRequirement,
            contextFilePaths: this.contextFilePaths,
            timestamp: new Date(),
            cost: 0  // Initialize cost
          });

          this.clearContextFilePaths();
          this.subscribeToStepResponse(workspaceId, stepId, conversation_id);
          this.userRequirement = '';

          const conversationHistoryStore = useConversationHistoryStore();
          await conversationHistoryStore.fetchConversationHistory();
        } else {
          throw new Error('Failed to send step requirement');
        }
      } catch (error) {
        console.error('Error sending step requirement:', error);
        throw error;
      } finally {
        this.isSending = false;
      }
    },

    subscribeToStepResponse(workspaceId: string, stepId: string, conversationId: string) {
      const { onResult, onError } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(
        StepResponseSubscription,
        {
          workspaceId,
          stepId,
          conversationId,
        }
      );

      onResult(({ data }) => {
        if (data?.stepResponse) {
          const { conversationId, message, cost } = data.stepResponse;
          this.addMessageToConversation(conversationId, {
            type: 'ai',
            text: message,
            timestamp: new Date(),
          }, cost);
        }
      });

      onError((error) => {
        console.error('Subscription error:', error);
      });

      this.isSubscribed = true;
    },

    async uploadFile(file: File): Promise<string> {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      try {
        const response = await apiService.post<{ filePath: string }>('/upload-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.filePath;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },

    addContextFilePath(contextFilePath: ContextFilePath) {
      this.contextFilePaths.push(contextFilePath);
    },

    removeContextFilePath(index: number) {
      this.contextFilePaths.splice(index, 1);
    },

    clearContextFilePaths() {
      this.contextFilePaths = [];
    },

    activateConversation(conversationId: string) {
      if (this.conversations.has(conversationId)) {
        this.selectedConversationId = conversationId;
      } else {
        console.warn(`Conversation with ID ${conversationId} not found.`);
      }
    },

    async setConversationFromHistory(conversationId: string) {
      const conversationHistoryStore = useConversationHistoryStore();
      await conversationHistoryStore.fetchTotalCost();
      const conversation = conversationHistoryStore.getConversations.find(conv => conv.id === conversationId);
      if (conversation) {
        this.conversations.set(conversation.id, { ...conversation });
        this.selectedConversationId = conversation.id;
      } else {
        console.warn(`Conversation with ID ${conversationId} not found in history.`);
      }
    },

    async searchContextFiles(requirement: string): Promise<void> {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;

      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      try {
        const { onResult, onError } = useQuery<SearchContextFilesQuery, SearchContextFilesQueryVariables>(
          SearchContextFiles,
          {
            workspaceId,
            query: requirement
          }
        );

        onResult((result) => {
          if (result.data?.hackathonSearch) {
            this.contextFilePaths = result.data.hackathonSearch.map(path => ({
              path,
              type: 'text'  // All files are text files
            }));
          } else {
            this.contextFilePaths = [];
          }
        });

        onError((error) => {
          console.error('Error searching context files:', error);
          throw error;
        });

      } catch (err) {
        console.error('Error searching context files:', err);
        throw err;
      }
    }
  },
});