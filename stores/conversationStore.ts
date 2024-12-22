
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
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';

interface ConversationStoreState {
  conversationsPerStep: Map<string, Map<string, Conversation>>;
  selectedConversationId: string | null;
  currentStepId: string | null;
  conversationRequirements: Map<string, string>;  // Map conversationId to requirement
  conversationContextPaths: Map<string, ContextFilePath[]>;  // Map conversationId to context paths
  isSubscribed: boolean;
  isSending: boolean;
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    conversationsPerStep: new Map(),
    selectedConversationId: null,
    currentStepId: null,
    conversationRequirements: new Map(),
    conversationContextPaths: new Map(),
    isSubscribed: false,
    isSending: false,
  }),

  getters: {
    activeConversations: (state) => {
      const stepId = state.currentStepId;
      if (stepId && state.conversationsPerStep.has(stepId)) {
        return Array.from(state.conversationsPerStep.get(stepId)!.values());
      }
      return [];
    },

    selectedConversation: (state) => {
      const stepId = state.currentStepId;
      if (stepId && state.selectedConversationId && state.conversationsPerStep.has(stepId)) {
        return state.conversationsPerStep.get(stepId)!.get(state.selectedConversationId) || null;
      }
      return null;
    },

    currentContextPaths: (state): ContextFilePath[] => {
      if (!state.selectedConversationId) return [];
      return state.conversationContextPaths.get(state.selectedConversationId) || [];
    },

    isCurrentlySending: (state): boolean => state.isSending,
    isConversationActive: (state): boolean => state.selectedConversationId !== null,

    conversationMessages: (state): Message[] => {
      const stepId = state.currentStepId;
      
      if (!stepId || !state.selectedConversationId) return [];
      
      const conversations = state.conversationsPerStep.get(stepId);
      if (!conversations) return [];
      
      const conversation = conversations.get(state.selectedConversationId);
      return conversation ? conversation.messages : [];
    },

    currentRequirement: (state): string => {
      if (!state.selectedConversationId) return '';
      return state.conversationRequirements.get(state.selectedConversationId) || '';
    },
  },

  actions: {
    setCurrentStepId(stepId: string | null) {
      this.currentStepId = stepId;
    },

    createTemporaryConversation() {
      const currentStepId = this.currentStepId;

      if (!currentStepId) {
        console.error('No step selected');
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newConversation: Conversation = {
        id: tempId,
        stepId: currentStepId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!this.conversationsPerStep.has(currentStepId)) {
        this.conversationsPerStep.set(currentStepId, new Map());
      }

      this.conversationsPerStep.get(currentStepId)!.set(tempId, newConversation);
      this.selectedConversationId = tempId;
      
      // Initialize maps for new conversation
      this.conversationRequirements.set(tempId, '');
      this.conversationContextPaths.set(tempId, []);
    },

    updateUserRequirement(newRequirement: string) {
      if (this.selectedConversationId) {
        this.conversationRequirements.set(this.selectedConversationId, newRequirement);
      }
    },

    setSelectedConversationId(conversationId: string | null) {
      this.selectedConversationId = conversationId;
    },

    addConversation(conversation: Conversation) {
      const stepId = this.currentStepId;
      if (!stepId) {
        console.error('No step selected');
        return;
      }

      if (!this.conversationsPerStep.has(stepId)) {
        this.conversationsPerStep.set(stepId, new Map());
      }

      this.conversationsPerStep.get(stepId)!.set(conversation.id, conversation);
      this.selectedConversationId = conversation.id;
    },

    async closeConversation(conversationId: string) {
      const stepId = this.currentStepId;

      if (!stepId) {
        console.error('No step selected');
        return;
      }

      if (!this.conversationsPerStep.has(stepId)) {
        console.error(`No conversations found for step ID ${stepId}`);
        return;
      }

      // Clean up conversation data
      this.conversationRequirements.delete(conversationId);
      this.conversationContextPaths.delete(conversationId);

      const conversation = this.conversationsPerStep.get(stepId)!.get(conversationId);
      if (!conversation) {
        console.error(`Conversation with ID ${conversationId} not found`);
        return;
      }

      if (conversationId.startsWith('temp-')) {
        this.conversationsPerStep.get(stepId)!.delete(conversationId);
        if (this.selectedConversationId === conversationId) {
          const nextConversation = Array.from(this.conversationsPerStep.get(stepId)!.values())[0] || null;
          this.selectedConversationId = nextConversation ? nextConversation.id : null;
        }
        return;
      }

      const workspaceStore = useWorkspaceStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;

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

        this.conversationsPerStep.get(stepId)!.delete(conversationId);
        if (this.selectedConversationId === conversationId) {
          const nextConversation = Array.from(this.conversationsPerStep.get(stepId)!.values())[0] || null;
          this.selectedConversationId = nextConversation ? nextConversation.id : null;
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
      const stepId = this.currentStepId;

      if (!stepId || !this.conversationsPerStep.has(stepId)) {
        console.error('No step selected or conversations not initialized');
        return;
      }

      const conversation = this.conversationsPerStep.get(stepId)!.get(conversationId);
      if (conversation) {
        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();
        this.conversationsPerStep.get(stepId)!.set(conversationId, { ...conversation });
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
        if (!this.selectedConversationId) {
          throw new Error('No active conversation');
        }

        const currentContextPaths = this.conversationContextPaths.get(this.selectedConversationId) || [];
        const currentRequirement = this.conversationRequirements.get(this.selectedConversationId) || '';

        const formattedContextFilePaths: ContextFilePathInput[] = currentContextPaths.map(cf => ({
          path: cf.path,
          type: cf.type,
        }));

        const mutationVariables: SendStepRequirementMutationVariables = {
          workspaceId,
          stepId,
          contextFilePaths: formattedContextFilePaths,
          requirement: currentRequirement,
          conversationId: this.selectedConversationId?.startsWith('temp-') ? null : this.selectedConversationId,
          llmModel: llmModel || null,
        };

        const result = await sendStepRequirementMutation(mutationVariables);

        if (result?.data?.sendStepRequirement) {
          const conversation_id = result.data.sendStepRequirement;

          if (this.selectedConversationId?.startsWith('temp-')) {
            // Transfer data from temporary conversation to new one
            const tempRequirement = this.conversationRequirements.get(this.selectedConversationId);
            const tempContextPaths = this.conversationContextPaths.get(this.selectedConversationId);
            
            if (tempRequirement) {
              this.conversationRequirements.set(conversation_id, tempRequirement);
            }
            if (tempContextPaths) {
              this.conversationContextPaths.set(conversation_id, tempContextPaths);
            }
            
            this.removeConversation(this.selectedConversationId);
          }

          if (!this.conversationsPerStep.get(stepId)!.has(conversation_id)) {
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
            text: currentRequirement,
            timestamp: new Date(),
            contextFilePaths: currentContextPaths,
          });

          this.clearContextFilePaths();
          this.subscribeToStepResponse(workspaceId, stepId, conversation_id);
          this.updateUserRequirement('');

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
          const { conversationId, messageChunk, isComplete } = data.stepResponse;
          this.appendToMessageInConversation(conversationId, messageChunk, isComplete);
        }
      });

      onError((error) => {
        console.error('Subscription error:', error);
      });

      this.isSubscribed = true;
    },

    appendToMessageInConversation(conversationId: string, messageChunk: string, isComplete: boolean) {
      const stepId = this.currentStepId;

      if (!stepId || !this.conversationsPerStep.has(stepId)) {
        console.error('No step selected or conversations not initialized');
        return;
      }

      const conversation = this.conversationsPerStep.get(stepId)!.get(conversationId);
      if (conversation) {
        let lastMessage = conversation.messages[conversation.messages.length - 1];

        if (lastMessage && lastMessage.type === 'ai' && lastMessage.isComplete === false) {
          lastMessage.chunks = lastMessage.chunks || [];
          lastMessage.chunks.push(messageChunk);
          lastMessage.isComplete = isComplete;

          if (!lastMessage.parserInstance) {
            lastMessage.segments = lastMessage.segments || [];
            lastMessage.parserInstance = new IncrementalAIResponseParser(lastMessage.segments);
            lastMessage.parserInstance.processChunks([messageChunk]);
          } else {
            lastMessage.parserInstance.processChunks([messageChunk]);
          }

          conversation.updatedAt = new Date().toISOString();

        } else {
          const segments: AIResponseSegment[] = [];
          const newMessage: Message = {
            type: 'ai',
            text: '',
            timestamp: new Date(),
            chunks: [messageChunk],
            isComplete: isComplete,
            segments,
            parserInstance: new IncrementalAIResponseParser(segments)
          };

          newMessage.parserInstance.processChunks([messageChunk]);
          conversation.messages.push(newMessage);
          conversation.updatedAt = new Date().toISOString();
        }

        this.conversationsPerStep.get(stepId)!.set(conversationId, { ...conversation });
      }
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
      if (this.selectedConversationId) {
        const currentPaths = this.conversationContextPaths.get(this.selectedConversationId) || [];
        this.conversationContextPaths.set(this.selectedConversationId, [...currentPaths, contextFilePath]);
      }
    },

    removeContextFilePath(index: number) {
      if (this.selectedConversationId) {
        const currentPaths = this.conversationContextPaths.get(this.selectedConversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        this.conversationContextPaths.set(this.selectedConversationId, newPaths);
      }
    },

    clearContextFilePaths() {
      if (this.selectedConversationId) {
        this.conversationContextPaths.set(this.selectedConversationId, []);
      }
    },

    activateConversation(conversationId: string) {
      const stepId = this.currentStepId;

      if (!stepId) {
        console.warn('No step selected.');
        return;
      }

      if (this.conversationsPerStep.has(stepId) && this.conversationsPerStep.get(stepId)!.has(conversationId)) {
        this.selectedConversationId = conversationId;
      } else {
        console.warn(`Conversation with ID ${conversationId} not found for step ${stepId}.`);
      }
    },

    setConversationFromHistory(conversationId: string) {
      const stepId = this.currentStepId;

      if (!stepId) {
        console.warn('No step selected.');
        return;
      }

      const conversationHistoryStore = useConversationHistoryStore();
      const conversation = conversationHistoryStore.getConversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const actualStepId = conversation.stepId || stepId;
        
        const newConversation: Conversation = {
          id: tempId,
          stepId: actualStepId,
          messages: conversation.messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!this.conversationsPerStep.has(actualStepId)) {
          this.conversationsPerStep.set(actualStepId, new Map());
        }

        this.conversationsPerStep.get(actualStepId)!.set(tempId, newConversation);
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
          if (!this.selectedConversationId) return;
          
          if (result.data?.hackathonSearch) {
            this.conversationContextPaths.set(
              this.selectedConversationId,
              result.data.hackathonSearch.map(path => ({
                path,
                type: 'text'
              }))
            );
          } else {
            this.conversationContextPaths.set(this.selectedConversationId, []);
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
      const stepId = this.currentStepId;

      if (stepId && this.conversationsPerStep.has(stepId)) {
        return this.conversationsPerStep.get(stepId)!.get(conversationId);
      }
      return undefined;
    }
  },
});
