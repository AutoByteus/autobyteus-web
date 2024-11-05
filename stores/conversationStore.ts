import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { SendStepRequirement } from '~/graphql/mutations/workflowStepMutations';
import { StepResponseSubscription } from '~/graphql/subscriptions/workflowStepSubscriptions';
import type {
  SendStepRequirementMutation,
  SendStepRequirementMutationVariables,
  StepResponseSubscriptionVariables,
  StepResponseSubscription as StepResponseSubscriptionType,
  ContextFilePathInput,
  LlmModel
} from '~/generated/graphql';
import type { Conversation, Message, ContextFilePath } from '~/types/conversation';
import apiService from '~/services/api';
import { useWorkspaceStore } from '~/stores/workspace';
import { useConversationHistoryStore } from '~/stores/conversationHistory'; // Added import

interface ConversationStoreState {
  currentConversation: Conversation | null;
  contextFilePaths: ContextFilePath[];
  isSubscribed: boolean;
  isSending: boolean;
  userRequirement: string;
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    currentConversation: null,
    contextFilePaths: [],
    isSubscribed: false,
    isSending: false,
    userRequirement: '',
  }),
  
  actions: {
    resetConversation() {
      this.currentConversation = null;
      this.contextFilePaths = [];
      this.isSubscribed = false;
      this.isSending = false;
      this.userRequirement = '';
    },

    updateUserRequirement(newRequirement: string) {
      this.userRequirement = newRequirement;
    },

    addUserMessage(text: string, contextFilePaths: ContextFilePath[]) {
      if (this.currentConversation) {
        this.currentConversation.messages.push({
          type: 'user',
          text,
          contextFilePaths,
          timestamp: new Date(),
        });
        this.currentConversation.updatedAt = new Date();
      }
    },

    addAIMessage(message: string) {
      if (this.currentConversation) {
        this.currentConversation.messages.push({
          type: 'ai',
          text: message,
          timestamp: new Date(),
        });
        this.currentConversation.updatedAt = new Date();
      }
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
          conversationId: this.currentConversation?.id || null,
          llmModel: llmModel || null,
        };

        const result = await sendStepRequirementMutation(mutationVariables);

        if (result?.data?.sendStepRequirement) {
          const conversation_id = result.data.sendStepRequirement;

          if (!this.currentConversation || this.currentConversation.id !== conversation_id) {
            this.currentConversation = {
              id: conversation_id,
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }

          if (llmModel) {
            this.addUserMessage(this.userRequirement, this.contextFilePaths);
            this.clearContextFilePaths();
          } else {
            this.addUserMessage(this.userRequirement, this.contextFilePaths);
          }

          this.subscribeToStepResponse(workspaceId, stepId, conversation_id);
          this.userRequirement = ''; // Clear the requirement after sending

          // Add the new conversation to history by fetching the updated history
          const conversationHistoryStore = useConversationHistoryStore();
          await conversationHistoryStore.fetchConversationHistory(); // Ensure the new conversation is included
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
      const { onResult, onError } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(StepResponseSubscription, {
        workspaceId,
        stepId,
        conversationId,
      });

      onResult(({ data }) => {
        if (data?.stepResponse) {
          this.addAIMessage(data.stepResponse);
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
      console.log(`Activating conversation with ID: ${conversationId}`);
      // Optional: Additional logic can be added here if needed
    },

    // Added method to set conversation by ID
    setConversationId(conversationId: string) {
      const conversationHistoryStore = useConversationHistoryStore();
      const conversation = conversationHistoryStore.getConversations.find(conv => conv.id === conversationId);
      if (conversation) {
        this.currentConversation = { ...conversation };
      } else {
        console.warn(`Conversation with ID ${conversationId} not found.`);
      }
    },
  },

  getters: {
    currentContextPaths: (state): ContextFilePath[] => state.contextFilePaths,
    isCurrentlySending: (state): boolean => state.isSending,
    isConversationActive: (state): boolean => state.currentConversation !== null,
    conversationMessages: (state): Message[] => state.currentConversation?.messages || [],
    currentRequirement: (state): string => state.userRequirement,
  },
});