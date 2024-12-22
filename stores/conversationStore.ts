
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
  selectedConversationIds: Map<string, string>;  // stepId -> conversationId
  currentStepId: string | null;
  conversationRequirements: Map<string, string>;
  conversationContextPaths: Map<string, ContextFilePath[]>;
  isSubscribed: boolean;
  isSending: boolean;
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    conversationsPerStep: new Map(),
    selectedConversationIds: new Map(),
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

    selectedConversationId: (state): string | null => {
      if (!state.currentStepId) return null;
      return state.selectedConversationIds.get(state.currentStepId) || null;
    },

    selectedConversation: (state): Conversation | null => {
      const stepId = state.currentStepId;
      if (!stepId) return null;
      
      const conversationId = state.selectedConversationIds.get(stepId);
      if (!conversationId || !state.conversationsPerStep.has(stepId)) return null;
      
      return state.conversationsPerStep.get(stepId)!.get(conversationId) || null;
    },

    currentContextPaths: (state): ContextFilePath[] => {
      const conversationId = state.selectedConversationIds.get(state.currentStepId!) || null;
      if (!conversationId) return [];
      return state.conversationContextPaths.get(conversationId) || [];
    },

    isCurrentlySending: (state): boolean => state.isSending,

    isConversationActive: (state): boolean => {
      const stepId = state.currentStepId;
      return stepId ? state.selectedConversationIds.has(stepId) : false;
    },

    conversationMessages: (state): Message[] => {
      const stepId = state.currentStepId;
      if (!stepId) return [];
      
      const conversationId = state.selectedConversationIds.get(stepId);
      if (!conversationId) return [];
      
      const conversations = state.conversationsPerStep.get(stepId);
      if (!conversations) return [];
      
      const conversation = conversations.get(conversationId);
      return conversation ? conversation.messages : [];
    },

    currentRequirement: (state): string => {
      const conversationId = state.selectedConversationIds.get(state.currentStepId!) || null;
      if (!conversationId) return '';
      return state.conversationRequirements.get(conversationId) || '';
    },
  },

  actions: {
    hasConversationsForStep(stepId: string): boolean {
      return this.conversationsPerStep.has(stepId) && 
             this.conversationsPerStep.get(stepId)!.size > 0;
    },

    setCurrentStepId(stepId: string | null) {
      const previousStepId = this.currentStepId;
      this.currentStepId = stepId;
      
      if (stepId) {
        // Initialize the conversations map for this step if it doesn't exist
        if (!this.conversationsPerStep.has(stepId)) {
          this.conversationsPerStep.set(stepId, new Map());
        }

        // Get conversations for this step
        const stepConversations = this.conversationsPerStep.get(stepId)!;
        
        // If there are existing conversations
        if (stepConversations.size > 0) {
          // If no conversation is selected for this step, select the first one
          if (!this.selectedConversationIds.has(stepId)) {
            const firstConversation = Array.from(stepConversations.values())[0];
            this.selectedConversationIds.set(stepId, firstConversation.id);
          }
        } else {
          // Create a temporary conversation if there are no conversations
          this.createTemporaryConversation();
        }
      } else {
        // Clear selection when no step is selected
        this.selectedConversationIds.delete(previousStepId!);
      }
    },

    setSelectedConversationId(conversationId: string | null) {
      if (!this.currentStepId) return;
      
      if (conversationId) {
        this.selectedConversationIds.set(this.currentStepId, conversationId);
      } else {
        this.selectedConversationIds.delete(this.currentStepId);
      }
    },

    createTemporaryConversation() {
      const currentStepId = this.currentStepId;
      if (!currentStepId) return;

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
      this.selectedConversationIds.set(currentStepId, tempId);
      
      // Initialize maps for new conversation
      this.conversationRequirements.set(tempId, '');
      this.conversationContextPaths.set(tempId, []);
    },

    updateUserRequirement(newRequirement: string) {
      const conversationId = this.selectedConversationIds.get(this.currentStepId!);
      if (conversationId) {
        this.conversationRequirements.set(conversationId, newRequirement);
      }
    },

    addConversation(conversation: Conversation) {
      const stepId = this.currentStepId;
      if (!stepId) return;

      if (!this.conversationsPerStep.has(stepId)) {
        this.conversationsPerStep.set(stepId, new Map());
      }

      this.conversationsPerStep.get(stepId)!.set(conversation.id, conversation);
      this.selectedConversationIds.set(stepId, conversation.id);
    },

    async closeConversation(conversationId: string) {
      const stepId = this.currentStepId;
      if (!stepId) return;

      try {
        // Remove from conversationsPerStep
        if (this.conversationsPerStep.has(stepId)) {
          this.conversationsPerStep.get(stepId)!.delete(conversationId);
        }

        // Clean up conversation data
        this.conversationRequirements.delete(conversationId);
        this.conversationContextPaths.delete(conversationId);

        // Update selected conversation
        if (this.selectedConversationIds.get(stepId) === conversationId) {
          const stepConversations = this.conversationsPerStep.get(stepId)!;
          if (stepConversations.size > 0) {
            // Select another conversation if available
            const nextConversation = Array.from(stepConversations.values())[0];
            this.selectedConversationIds.set(stepId, nextConversation.id);
          } else {
            // Create a new conversation if this was the last one
            this.createTemporaryConversation();
          }
        }

        // Handle backend cleanup for non-temporary conversations
        if (!conversationId.startsWith('temp-')) {
          const workspaceStore = useWorkspaceStore();
          const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;

          if (currentWorkspaceId && stepId) {
            const { mutate: closeConversationMutation } = useMutation(CloseConversation);
            await closeConversationMutation({
              workspaceId: currentWorkspaceId,
              stepId: stepId,
              conversationId
            });
          }
        }
      } catch (error) {
        console.error('Error closing conversation:', error);
        throw error;
      }
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
        const conversationId = this.selectedConversationIds.get(stepId);
        if (!conversationId) {
          throw new Error('No active conversation');
        }

        const currentContextPaths = this.conversationContextPaths.get(conversationId) || [];
        const currentRequirement = this.conversationRequirements.get(conversationId) || '';

        const formattedContextFilePaths: ContextFilePathInput[] = currentContextPaths.map(cf => ({
          path: cf.path,
          type: cf.type,
        }));

        const mutationVariables: SendStepRequirementMutationVariables = {
          workspaceId,
          stepId,
          contextFilePaths: formattedContextFilePaths,
          requirement: currentRequirement,
          conversationId: conversationId.startsWith('temp-') ? null : conversationId,
          llmModel: llmModel || null,
        };

        const result = await sendStepRequirementMutation(mutationVariables);

        if (result?.data?.sendStepRequirement) {
          const conversation_id = result.data.sendStepRequirement;

          if (conversationId.startsWith('temp-')) {
            // Transfer data from temporary conversation to new one
            const tempRequirement = this.conversationRequirements.get(conversationId);
            const tempContextPaths = this.conversationContextPaths.get(conversationId);
            
            if (tempRequirement) {
              this.conversationRequirements.set(conversation_id, tempRequirement);
            }
            if (tempContextPaths) {
              this.conversationContextPaths.set(conversation_id, tempContextPaths);
            }
            
            await this.closeConversation(conversationId);
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
      const conversationId = this.selectedConversationIds.get(this.currentStepId!);
      if (conversationId) {
        const currentPaths = this.conversationContextPaths.get(conversationId) || [];
        this.conversationContextPaths.set(conversationId, [...currentPaths, contextFilePath]);
      }
    },

    removeContextFilePath(index: number) {
      const conversationId = this.selectedConversationIds.get(this.currentStepId!);
      if (conversationId) {
        const currentPaths = this.conversationContextPaths.get(conversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        this.conversationContextPaths.set(conversationId, newPaths);
      }
    },

    clearContextFilePaths() {
      const conversationId = this.selectedConversationIds.get(this.currentStepId!);
      if (conversationId) {
        this.conversationContextPaths.set(conversationId, []);
      }
    },

    activateConversation(conversationId: string) {
      const stepId = this.currentStepId;

      if (!stepId) {
        console.warn('No step selected.');
        return;
      }

      if (this.conversationsPerStep.has(stepId) && this.conversationsPerStep.get(stepId)!.has(conversationId)) {
        this.selectedConversationIds.set(stepId, conversationId);
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
        this.selectedConversationIds.set(actualStepId, tempId);
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
          const conversationId = this.selectedConversationIds.get(this.currentStepId!);
          if (!conversationId) return;
          
          if (result.data?.hackathonSearch) {
            this.conversationContextPaths.set(
              conversationId,
              result.data.hackathonSearch.map(path => ({
                path,
                type: 'text'
              }))
            );
          } else {
            this.conversationContextPaths.set(conversationId, []);
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