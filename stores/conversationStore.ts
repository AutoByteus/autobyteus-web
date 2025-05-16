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
import type { Conversation, Message, ContextFilePath, AIMessage } from '~/types/conversation';
import apiService from '~/services/api';
import { useWorkspaceStore } from '~/stores/workspace';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useWorkflowStore } from '~/stores/workflow';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';

interface ConversationStoreState {
  activeConversations: Map<string, Conversation>; 
  selectedConversationId: string | null; 
  conversationRequirements: Map<string, string>; 
  conversationContextPaths: Map<string, ContextFilePath[]>; 
  conversationModelSelection: Map<string, string>; 
  isSendingMap: Map<string, boolean>; // Key: conversationId -> sending status
  isSubscribedMap: Map<string, boolean>; // Key: conversationId -> subscribed status
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    activeConversations: new Map(), 
    selectedConversationId: null,
    conversationRequirements: new Map(),
    conversationContextPaths: new Map(),
    conversationModelSelection: new Map(),
    isSendingMap: new Map(), // Initialize as Map
    isSubscribedMap: new Map(), // Initialize as Map
  }),

  getters: {
    allOpenConversations: (state): Conversation[] => {
      // Sort by updatedAt in ascending order (oldest first, newest at the end)
      return Array.from(state.activeConversations.values()) 
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    },

    selectedConversation: (state): Conversation | null => {
      if (!state.selectedConversationId) return null;
      return state.activeConversations.get(state.selectedConversationId) || null;
    },

    currentContextPaths: (state): ContextFilePath[] => {
      if (!state.selectedConversationId) return [];
      return state.conversationContextPaths.get(state.selectedConversationId) || [];
    },

    currentModelSelection: (state): string => {
      if (!state.selectedConversationId) return '';
      return state.conversationModelSelection.get(state.selectedConversationId) || '';
    },

    // This getter now reflects the sending state of the *currently selected* conversation
    isCurrentlySending(state): boolean {
      if (!state.selectedConversationId) return false;
      return !!state.isSendingMap.get(state.selectedConversationId);
    },

    // Optional: Getter for specific conversation's sending state
    getIsSendingForConversation: (state) => (conversationId: string): boolean => {
      return !!state.isSendingMap.get(conversationId);
    },

    // Optional: Getter for specific conversation's subscribed state
    getIsSubscribedForConversation: (state) => (conversationId: string): boolean => {
      return !!state.isSubscribedMap.get(conversationId);
    },

    conversationMessages(state): Message[] {
      const conv: Conversation | null = this.selectedConversation; 
      return conv ? conv.messages : [];
    },

    currentRequirement: (state): string => {
      if (!state.selectedConversationId) return '';
      return state.conversationRequirements.get(state.selectedConversationId) || '';
    },
  },

  actions: {
    setSelectedConversationId(conversationId: string | null) {
      this.selectedConversationId = conversationId;
    },

    createTemporaryConversation(stepId: string) {
      if (!stepId) {
        console.warn('Cannot create temporary conversation without stepId');
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const newConversation: Conversation = {
        id: tempId,
        stepId: stepId,
        messages: [],
        createdAt: now,
        updatedAt: now, // Ensure updatedAt is set on creation
      };

      this.activeConversations.set(tempId, newConversation);
      
      this.conversationRequirements.set(tempId, '');
      this.conversationContextPaths.set(tempId, []);
      this.conversationModelSelection.set(tempId, ''); 
      this.isSendingMap.set(tempId, false);
      this.isSubscribedMap.set(tempId, false);
      
      this.setSelectedConversationId(tempId);
    },

    updateUserRequirement(newRequirement: string) {
      if (this.selectedConversationId) {
        this.conversationRequirements.set(this.selectedConversationId, newRequirement);
        const conv = this.activeConversations.get(this.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); // Keep updatedAt fresh
      }
    },

    updateModelSelection(newModel: string) {
      if (this.selectedConversationId) {
        this.conversationModelSelection.set(this.selectedConversationId, newModel);
        const conv = this.activeConversations.get(this.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); // Keep updatedAt fresh
      }
    },
    
    async closeConversation(conversationIdToClose: string) {
      const conversationToClose = this.activeConversations.get(conversationIdToClose);
      if (!conversationToClose) return;

      const stepId = conversationToClose.stepId;
      this.activeConversations.delete(conversationIdToClose);

      this.conversationRequirements.delete(conversationIdToClose);
      this.conversationContextPaths.delete(conversationIdToClose);
      this.conversationModelSelection.delete(conversationIdToClose);
      this.isSendingMap.delete(conversationIdToClose);
      this.isSubscribedMap.delete(conversationIdToClose);


      if (this.selectedConversationId === conversationIdToClose) {
        const openConversationsArray = this.allOpenConversations; // This will be sorted ascending by time
        if (openConversationsArray.length > 0) {
          // Select the last one (most recent) if multiple are open
          this.setSelectedConversationId(openConversationsArray[openConversationsArray.length - 1].id);
        } else {
          const workflowStore = useWorkflowStore();
          if (workflowStore.currentSelectedStepId) {
            this.createTemporaryConversation(workflowStore.currentSelectedStepId);
          } else {
            this.setSelectedConversationId(null);
          }
        }
      }

      if (!conversationIdToClose.startsWith('temp-')) {
        const workspaceStore = useWorkspaceStore();
        const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
        if (currentWorkspaceId) {
          try {
            const { mutate: closeConversationMutation } = useMutation(CloseConversation);
            await closeConversationMutation({
              workspaceId: currentWorkspaceId,
              stepId: stepId, 
              conversationId: conversationIdToClose
            });
          } catch (error) {
            console.error('Error closing conversation on backend:', error);
          }
        }
      }
    },

    addMessageToConversation(conversationId: string, message: Message) {
      const conversation = this.activeConversations.get(conversationId);
      if (!conversation) {
        console.error(`Conversation ${conversationId} not found to add message.`);
        return;
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
      this.activeConversations.set(conversationId, { ...conversation }); 
    },

    async sendStepRequirementAndSubscribe(workspaceId: string): Promise<void> {
      const currentConversation = this.selectedConversation;
      if (!currentConversation) {
        throw new Error('No active conversation selected.');
      }
      const conversationId = currentConversation.id; 
      
      currentConversation.updatedAt = new Date().toISOString(); // Update timestamp before sending
      
      const conversationIdForRequest = conversationId.startsWith('temp-') ? null : conversationId;
      const currentRequirementText = this.conversationRequirements.get(conversationId) || '';
      const contextPaths = this.conversationContextPaths.get(conversationId) || [];
      
      let modelForMutation: string | null = null;
      if (currentConversation.messages.length === 0) {
        modelForMutation = this.conversationModelSelection.get(conversationId) || null;
        if (!modelForMutation) {
            console.error("Model not selected for the first message. Check RequirementTextInputArea logic.");
            this.isSendingMap.set(conversationId, false); 
            throw new Error("Please select a model for the first message.");
        }
      }

      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement);
      this.isSendingMap.set(conversationId, true);

      try {
        const formattedContextFilePaths: ContextFilePathInput[] = contextPaths.map(cf => ({
          path: cf.path,
          type: cf.type,
        }));

        const mutationVariables: SendStepRequirementMutationVariables = {
          workspaceId,
          stepId: currentConversation.stepId,
          contextFilePaths: formattedContextFilePaths,
          requirement: currentRequirementText,
          conversationId: conversationIdForRequest,
          llmModel: modelForMutation,
        };

        const result = await sendStepRequirementMutation(mutationVariables);

        if (result?.data?.sendStepRequirement) {
          const permanentConversationId = result.data.sendStepRequirement;
          let finalConversationId = conversationId;

          this.addMessageToConversation(conversationId, { 
            type: 'user',
            text: currentRequirementText,
            timestamp: new Date(),
            contextFilePaths: contextPaths
          });
          
          if (conversationId.startsWith('temp-') && conversationId !== permanentConversationId) {
            const oldTempConversation = this.activeConversations.get(conversationId)!;
            oldTempConversation.id = permanentConversationId; 
            oldTempConversation.updatedAt = new Date().toISOString(); // Ensure new ID also has fresh timestamp
            
            this.activeConversations.delete(conversationId);
            this.activeConversations.set(permanentConversationId, oldTempConversation);
            finalConversationId = permanentConversationId;

            this.conversationRequirements.set(permanentConversationId, this.conversationRequirements.get(conversationId) || '');
            this.conversationContextPaths.set(permanentConversationId, this.conversationContextPaths.get(conversationId) || []);
            this.conversationModelSelection.set(permanentConversationId, this.conversationModelSelection.get(conversationId) || '');
            
            this.isSendingMap.set(permanentConversationId, this.isSendingMap.get(conversationId) || false);
            this.isSubscribedMap.set(permanentConversationId, this.isSubscribedMap.get(conversationId) || false);


            this.conversationRequirements.delete(conversationId);
            this.conversationContextPaths.delete(conversationId); // Clear paths for temp id
            this.conversationModelSelection.delete(conversationId);
            this.isSendingMap.delete(conversationId);
            this.isSubscribedMap.delete(conversationId);
            
            if (this.selectedConversationId === conversationId) {
              this.setSelectedConversationId(permanentConversationId);
            }
          }
          
          this.conversationContextPaths.set(finalConversationId, []);
          this.conversationRequirements.set(finalConversationId, ''); 

          this.subscribeToStepResponse(workspaceId, currentConversation.stepId, finalConversationId);

          const conversationHistoryStore = useConversationHistoryStore();
          const workflowStore = useWorkflowStore();
          if (conversationHistoryStore.stepName === workflowStore.getStepNameById(currentConversation.stepId)) {
             await conversationHistoryStore.fetchConversationHistory();
          }
        } else {
          this.isSendingMap.set(conversationId, false); 
          throw new Error('Failed to send step requirement: No conversation ID returned.');
        }
      } catch (error) {
        console.error('Error sending step requirement:', error);
        this.isSendingMap.set(conversationId, false); 
        throw error;
      }
    },

    subscribeToStepResponse(workspaceId: string, stepId: string, conversationId: string) {
      const { onResult, onError, stop } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(
        StepResponseSubscription,
        {
          workspaceId,
          stepId,
          conversationId,
        }
      );
      this.isSubscribedMap.set(conversationId, true);

      onResult(({ data }) => {
        this.isSendingMap.set(conversationId, false); 
        if (data?.stepResponse) {
          const {
            conversationId: respConvId, 
            messageChunk,
            isComplete,
            promptTokens,
            completionTokens,
            promptCost,
            completionCost,
          } = data.stepResponse;
          
          const conv = this.activeConversations.get(respConvId);
          if(conv) conv.updatedAt = new Date().toISOString(); // Update on new chunk

          this.appendToMessageInConversation(
            respConvId,
            messageChunk,
            isComplete,
            promptTokens,
            completionTokens,
            promptCost,
            completionCost
          );
          if (isComplete) {
            stop(); 
            this.isSubscribedMap.set(conversationId, false);
          }
        }
      });

      onError((error) => {
        console.error(`Subscription error for conversation ${conversationId}:`, error);
        this.isSendingMap.set(conversationId, false);
        this.isSubscribedMap.set(conversationId, false);
        const errorMsg = `Error receiving AI response: ${error.message}`;
        if (this.activeConversations.has(conversationId)){
            const conv = this.activeConversations.get(conversationId)!;
            conv.updatedAt = new Date().toISOString(); // Update on error too
            this.appendToMessageInConversation(conversationId, errorMsg, true);
        }
      });
    },

    appendToMessageInConversation(
      conversationId: string,
      messageChunk: string | null,
      isComplete: boolean,
      promptTokens?: number | null,
      completionTokens?: number | null,
      promptCost?: number | null,
      completionCost?: number | null
    ) {
      const conversation = this.activeConversations.get(conversationId);
      if (!conversation) return;

      let lastMessage = conversation.messages[conversation.messages.length - 1] as AIMessage | undefined;

      if (messageChunk || (!lastMessage || lastMessage?.type !== 'ai' || lastMessage?.isComplete)) {
         if (!lastMessage || lastMessage.type !== 'ai' || lastMessage.isComplete) {
            const segments: AIResponseSegment[] = [];
            const newAiMessage: AIMessage = {
              type: 'ai',
              text: '', 
              timestamp: new Date(),
              chunks: messageChunk ? [messageChunk] : [],
              isComplete: false, 
              segments,
              parserInstance: new IncrementalAIResponseParser(segments)
            };
            if (messageChunk) newAiMessage.parserInstance.processChunks([messageChunk]);
            conversation.messages.push(newAiMessage);
            lastMessage = newAiMessage;
          } else if (messageChunk) {
            lastMessage.chunks = lastMessage.chunks || [];
            lastMessage.chunks.push(messageChunk);
            lastMessage.parserInstance.processChunks([messageChunk]);
          }
      }

      if (isComplete && lastMessage && lastMessage.type === 'ai') {
        lastMessage.isComplete = true;
        const userMessage = conversation.messages.findLast(m => m.type === 'user');
        if (userMessage && promptTokens != null && promptCost != null) {
          userMessage.promptTokens = promptTokens;
          userMessage.promptCost = promptCost;
        }
        if (completionTokens != null && completionCost != null) {
          lastMessage.completionTokens = completionTokens;
          lastMessage.completionCost = completionCost;
        }
      }
      
      conversation.updatedAt = new Date().toISOString();
      this.activeConversations.set(conversationId, { ...conversation });
    },

    async uploadFile(file: File): Promise<string> {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("Workspace ID not available for file upload.");
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      try {
        const response = await apiService.post<{ fileUrl: string }>('/upload-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.fileUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },

    addContextFilePath(contextFilePath: ContextFilePath) {
      if (this.selectedConversationId) {
        const currentPaths = this.conversationContextPaths.get(this.selectedConversationId) || [];
        this.conversationContextPaths.set(this.selectedConversationId, [...currentPaths, contextFilePath]);
        const conv = this.activeConversations.get(this.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    removeContextFilePath(index: number) {
      if (this.selectedConversationId) {
        const currentPaths = this.conversationContextPaths.get(this.selectedConversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        this.conversationContextPaths.set(this.selectedConversationId, newPaths);
        const conv = this.activeConversations.get(this.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    clearContextFilePaths() {
      if (this.selectedConversationId) {
        this.conversationContextPaths.set(this.selectedConversationId, []);
        const conv = this.activeConversations.get(this.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    setConversationFromHistory(historicalConversationData: Conversation) {
      if (typeof historicalConversationData !== 'object' || historicalConversationData === null) {
        console.error('Invalid historical conversation data provided:', historicalConversationData);
        return;
      }

      let stepIdToUse = historicalConversationData.stepId;

      if (!stepIdToUse) {
        console.warn('Historical conversation is missing stepId. Falling back to current workflow step.');
        const workflowStore = useWorkflowStore();
        if (!workflowStore.currentSelectedStepId) {
            console.error('Cannot load historical conversation: no current step fallback and historical data missing stepId.');
            return;
        }
        stepIdToUse = workflowStore.currentSelectedStepId;
      }
      
      const tempId = `temp-hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const copiedMessages = historicalConversationData.messages.map(m => {
        const messageCopy = { ...m };
        if (messageCopy.type === 'ai') {
          const segments: AIResponseSegment[] = [];
          const parser = new IncrementalAIResponseParser(segments);
          if (messageCopy.text) { 
            parser.processChunks([messageCopy.text]);
          } else if (messageCopy.chunks && messageCopy.chunks.length > 0) { 
             parser.processChunks(messageCopy.chunks);
          }
          messageCopy.segments = segments;
          messageCopy.parserInstance = parser;
          messageCopy.isComplete = true; 
        }
        return messageCopy;
      });

      const newConversation: Conversation = {
        ...historicalConversationData, 
        id: tempId, 
        stepId: stepIdToUse, 
        messages: copiedMessages,
        createdAt: historicalConversationData.createdAt || now, // Use original or now
        updatedAt: now, // Loaded from history, so it's "updated" now
      };

      this.activeConversations.set(tempId, newConversation);
      
      this.conversationRequirements.set(tempId, ''); 
      this.conversationContextPaths.set(tempId, []);
      this.conversationModelSelection.set(tempId, ''); 
      this.isSendingMap.set(tempId, false);
      this.isSubscribedMap.set(tempId, false);

      this.setSelectedConversationId(tempId);
    },
    
    async searchContextFiles(requirement: string): Promise<void> {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;

      if (!workspaceId) {
        throw new Error('No workspace selected');
      }
      if (!this.selectedConversationId) {
        throw new Error('No conversation selected for context search.');
      }
      const targetConversationId = this.selectedConversationId;

      try {
        const result = await new Promise<SearchContextFilesQuery | null>((resolve, reject) => {
            const { onResult, onError: onQueryError } = useQuery<SearchContextFilesQuery, SearchContextFilesQueryVariables>(
              SearchContextFiles,
              {
                workspaceId,
                query: requirement
              },
              { fetchPolicy: 'network-only' } 
            );
            onResult(queryResult => resolve(queryResult.data || null));
            onQueryError(error => reject(error));
        });
          
        if (result?.hackathonSearch) {
            this.conversationContextPaths.set(
              targetConversationId, 
              result.hackathonSearch.map(path => ({
                path,
                type: 'text' 
              }))
            );
        } else {
            this.conversationContextPaths.set(targetConversationId, []);
        }
        const conv = this.activeConversations.get(targetConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();

      } catch (err) {
        console.error('Error searching context files:', err);
        if (this.selectedConversationId === targetConversationId) { 
            this.conversationContextPaths.set(targetConversationId, []); 
            const conv = this.activeConversations.get(targetConversationId);
            if (conv) conv.updatedAt = new Date().toISOString();
        }
        throw err;
      }
    },

    getConversationById(conversationId: string): Conversation | undefined {
      return this.activeConversations.get(conversationId);
    },

    ensureConversationForStep(stepId: string): void {
        if (!stepId) {
            console.warn("ensureConversationForStep called without stepId");
            return;
        }

        const currentSelectedConv = this.selectedConversation;

        if (!currentSelectedConv || currentSelectedConv.stepId !== stepId) {
          // When switching steps, try to pick the most recently updated conversation for that step.
          // Since allOpenConversations is sorted ascending (oldest first), we'd take the last one.
            const conversationsForStep = Array.from(this.activeConversations.values())
                .filter(c => c.stepId === stepId)
                .sort((a,b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); // Ascending

            if (conversationsForStep.length > 0) {
                this.setSelectedConversationId(conversationsForStep[conversationsForStep.length - 1].id); // Last one is most recent
            } else {
                this.createTemporaryConversation(stepId);
            }
        }
    },
  },
});
