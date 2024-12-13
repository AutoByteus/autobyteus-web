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
        ? state.conversations.get(state.selectedConversationId)
        : null,
    currentContextPaths: (state): ContextFilePath[] => state.contextFilePaths,
    isCurrentlySending: (state): boolean => state.isSending,
    isConversationActive: (state): boolean => state.selectedConversationId !== null,
    conversationMessages: (state): Message[] =>
      state.selectedConversationId
        ? state.conversations.get(state.selectedConversationId)?.messages || []
        : [],
    currentRequirement: (state): string => state.userRequirement,
  },

  actions: {
    resetConversations() {
      this.conversations.clear();
      this.selectedConversationId = null;
      this.resetInputState();
    },

    resetInputState() {
      this.contextFilePaths = [];
      this.isSubscribed = false;
      this.isSending = false;
      this.userRequirement = '';
    },

    createTemporaryConversation() {
      const workflowStore = useWorkflowStore();
      const currentStepId = workflowStore.currentSelectedStepId;

      if (!currentStepId) {
        console.error('No step selected');
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newConversation: Conversation = {
        id: tempId,
        stepId: currentStepId, // Associate the temp conversation with the current step
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      // Handle temporary conversations without backend call
      if (conversationId.startsWith('temp-')) {
        // Temp conversation, remove locally without backend call
        this.conversations.delete(conversationId);
        if (this.selectedConversationId === conversationId) {
          const nextConversation = this.activeConversations[0];
          this.selectedConversationId = nextConversation?.id || null;
        }
        return;
      }

      const workspaceStore = useWorkspaceStore();
      const workflowStore = useWorkflowStore(); // Import workflowStore
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;

      const conversation = this.conversations.get(conversationId);
      let stepId = conversation?.stepId;

      if (!stepId) {
        // Use current stepId from workflowStore if stepId is missing
        stepId = workflowStore.currentSelectedStepId;
        console.warn(`stepId was missing for conversation ${conversationId}, using currentSelectedStepId ${stepId}`);
      }

      if (!currentWorkspaceId || !stepId) {
        console.error('Missing workspace ID or step ID');
        return;
      }

      try {
        const { mutate: closeConversationMutation } = useMutation(CloseConversation);

        await closeConversationMutation({
          workspaceId: currentWorkspaceId,
          stepId: stepId,
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

    addMessageToConversation(conversationId: string, message: Message) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();
        this.conversations.set(conversationId, { ...conversation });
      }
    },

    async sendStepRequirementAndSubscribe(
      workspaceId: string,
      stepId: string,
      requirement: string,
      llmModel?: string
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
              stepId: stepId,
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.addConversation(newConversation);
          }

          this.addMessageToConversation(conversation_id, {
            type: 'user',
            text: this.userRequirement,
            contextFilePaths: this.contextFilePaths,
            timestamp: new Date(),
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
          const { conversationId, message } = data.stepResponse;
          this.addMessageToConversation(conversationId, {
            type: 'ai',
            text: message,
            timestamp: new Date(),
          });
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

    setConversationFromHistory(conversationId: string) {
      const conversationHistoryStore = useConversationHistoryStore();
      const workflowStore = useWorkflowStore();
      const conversation = conversationHistoryStore.getConversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        // Generate temporary ID using the same pattern as createTemporaryConversation
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const stepId = conversation.stepId || workflowStore.currentSelectedStepId;
        
        const newConversation: Conversation = {
          id: tempId, // Use temporary ID instead of historical ID
          stepId: stepId,
          messages: conversation.messages,
          createdAt: new Date().toISOString(), // Reset creation time to now
          updatedAt: new Date().toISOString(),
        };
        
        this.conversations.set(tempId, newConversation);
        this.selectedConversationId = tempId;
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
              type: 'text'
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
    },

    getConversationById(conversationId: string): Conversation | undefined {
      return this.conversations.get(conversationId);
    }
  },
});