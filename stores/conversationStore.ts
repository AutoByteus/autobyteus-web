import { defineStore, storeToRefs } from 'pinia';
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

interface WorkspaceConversationState {
  activeConversations: Map<string, Conversation>; 
  selectedConversationId: string | null; 
  conversationRequirements: Map<string, string>; 
  conversationContextPaths: Map<string, ContextFilePath[]>; 
  conversationModelSelection: Map<string, string>; 
  isSendingMap: Map<string, boolean>;
  isSubscribedMap: Map<string, boolean>;
}

interface ConversationStoreState {
  conversationsByWorkspace: Map<string, WorkspaceConversationState>;
}

const createDefaultWorkspaceState = (): WorkspaceConversationState => ({
  activeConversations: new Map(),
  selectedConversationId: null,
  conversationRequirements: new Map(),
  conversationContextPaths: new Map(),
  conversationModelSelection: new Map(),
  isSendingMap: new Map(),
  isSubscribedMap: new Map(),
});

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    conversationsByWorkspace: new Map(),
  }),

  getters: {
    // Helper getter to safely access the current workspace's state
    _currentWorkspaceState(state): WorkspaceConversationState | null {
      const workspaceStore = useWorkspaceStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!currentWorkspaceId) return null;
      return state.conversationsByWorkspace.get(currentWorkspaceId) || null;
    },

    allOpenConversations(): Conversation[] {
      return this._currentWorkspaceState ? Array.from(this._currentWorkspaceState.activeConversations.values()) : [];
    },

    selectedConversation(): Conversation | null {
      if (!this._currentWorkspaceState || !this._currentWorkspaceState.selectedConversationId) return null;
      return this._currentWorkspaceState.activeConversations.get(this._currentWorkspaceState.selectedConversationId) || null;
    },

    selectedConversationId(): string | null {
      return this._currentWorkspaceState?.selectedConversationId || null;
    },

    currentContextPaths(): ContextFilePath[] {
      if (!this.selectedConversationId || !this._currentWorkspaceState) return [];
      return this._currentWorkspaceState.conversationContextPaths.get(this.selectedConversationId) || [];
    },

    currentModelSelection(): string {
      if (!this.selectedConversationId || !this._currentWorkspaceState) return '';
      return this._currentWorkspaceState.conversationModelSelection.get(this.selectedConversationId) || '';
    },

    isCurrentlySending(): boolean {
      if (!this.selectedConversationId || !this._currentWorkspaceState) return false;
      return !!this._currentWorkspaceState.isSendingMap.get(this.selectedConversationId);
    },

    conversationMessages(): Message[] {
      return this.selectedConversation ? this.selectedConversation.messages : [];
    },

    currentRequirement(): string {
      if (!this.selectedConversationId || !this._currentWorkspaceState) return '';
      return this._currentWorkspaceState.conversationRequirements.get(this.selectedConversationId) || '';
    },
  },

  actions: {
    // Helper action to get or create state for the current workspace
    _getOrCreateCurrentWorkspaceState(): WorkspaceConversationState {
      const workspaceStore = useWorkspaceStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!currentWorkspaceId) {
        throw new Error("Cannot get conversation state: No workspace is selected.");
      }
      if (!this.conversationsByWorkspace.has(currentWorkspaceId)) {
        this.conversationsByWorkspace.set(currentWorkspaceId, createDefaultWorkspaceState());
      }
      return this.conversationsByWorkspace.get(currentWorkspaceId)!;
    },

    setSelectedConversationId(conversationId: string | null) {
      try {
        const wsState = this._getOrCreateCurrentWorkspaceState();
        wsState.selectedConversationId = conversationId;
      } catch (e) {
        console.error(e);
      }
    },

    createTemporaryConversation(stepId: string) {
      if (!stepId) {
        console.warn('Cannot create temporary conversation without stepId');
        return;
      }
      const wsState = this._getOrCreateCurrentWorkspaceState();

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const newConversation: Conversation = {
        id: tempId,
        stepId: stepId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

      wsState.activeConversations.set(tempId, newConversation);
      wsState.conversationRequirements.set(tempId, '');
      wsState.conversationContextPaths.set(tempId, []);
      wsState.conversationModelSelection.set(tempId, '');
      wsState.isSendingMap.set(tempId, false);
      wsState.isSubscribedMap.set(tempId, false);
      wsState.selectedConversationId = tempId;
    },

    updateUserRequirement(newRequirement: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.selectedConversationId) {
        wsState.conversationRequirements.set(wsState.selectedConversationId, newRequirement);
      }
    },

    updateModelSelection(newModel: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.selectedConversationId) {
        wsState.conversationModelSelection.set(wsState.selectedConversationId, newModel);
      }
    },
    
    async closeConversation(conversationIdToClose: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const conversationToClose = wsState.activeConversations.get(conversationIdToClose);
      if (!conversationToClose) return;

      const stepId = conversationToClose.stepId;
      wsState.activeConversations.delete(conversationIdToClose);
      wsState.conversationRequirements.delete(conversationIdToClose);
      wsState.conversationContextPaths.delete(conversationIdToClose);
      wsState.conversationModelSelection.delete(conversationIdToClose);
      wsState.isSendingMap.delete(conversationIdToClose);
      wsState.isSubscribedMap.delete(conversationIdToClose);

      if (wsState.selectedConversationId === conversationIdToClose) {
        const openConversationsArray = Array.from(wsState.activeConversations.values());
        if (openConversationsArray.length > 0) {
          wsState.selectedConversationId = openConversationsArray[openConversationsArray.length - 1].id;
        } else {
          const workflowStore = useWorkflowStore();
          if (workflowStore.currentSelectedStepId) {
            this.createTemporaryConversation(workflowStore.currentSelectedStepId);
          } else {
            wsState.selectedConversationId = null;
          }
        }
      }

      if (!conversationIdToClose.startsWith('temp-')) {
        const workspaceStore = useWorkspaceStore();
        if (workspaceStore.currentSelectedWorkspaceId) {
          try {
            const { mutate: closeConversationMutation } = useMutation(CloseConversation);
            await closeConversationMutation({
              workspaceId: workspaceStore.currentSelectedWorkspaceId,
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
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const conversation = wsState.activeConversations.get(conversationId);
      if (!conversation) {
        console.error(`Conversation ${conversationId} not found to add message.`);
        return;
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
    },

    async sendStepRequirementAndSubscribe(workspaceId: string): Promise<void> {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const currentConversation = this.selectedConversation;
      if (!currentConversation) {
        throw new Error('No active conversation selected.');
      }
      const conversationId = currentConversation.id; 
      
      currentConversation.updatedAt = new Date().toISOString();
      
      const conversationIdForRequest = conversationId.startsWith('temp-') ? null : conversationId;
      const currentRequirementText = wsState.conversationRequirements.get(conversationId) || '';
      const contextPaths = wsState.conversationContextPaths.get(conversationId) || [];
      
      let modelForMutation: string | null = null;
      if (currentConversation.messages.length === 0) {
        modelForMutation = wsState.conversationModelSelection.get(conversationId) || null;
        if (!modelForMutation) {
            console.error("Model not selected for the first message.");
            wsState.isSendingMap.set(conversationId, false); 
            throw new Error("Please select a model for the first message.");
        }
      }

      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement);
      wsState.isSendingMap.set(conversationId, true);

      try {
        const result = await sendStepRequirementMutation({
          workspaceId,
          stepId: currentConversation.stepId,
          contextFilePaths: contextPaths.map(cf => ({ path: cf.path, type: cf.type })),
          requirement: currentRequirementText,
          conversationId: conversationIdForRequest,
          llmModel: modelForMutation,
        });

        if (result?.data?.sendStepRequirement) {
          const permanentConversationId = result.data.sendStepRequirement;
          let finalConversationId = conversationId;

          this.addMessageToConversation(conversationId, { 
            type: 'user', text: currentRequirementText, timestamp: new Date(), contextFilePaths: contextPaths
          });
          
          if (conversationId.startsWith('temp-') && conversationId !== permanentConversationId) {
            const oldTempConversation = wsState.activeConversations.get(conversationId)!;
            const preservedMessages = oldTempConversation.messages;
            const preservedCreatedAt = oldTempConversation.createdAt;

            wsState.activeConversations.delete(conversationId);

            oldTempConversation.id = permanentConversationId; 
            oldTempConversation.messages = preservedMessages;
            oldTempConversation.createdAt = preservedCreatedAt;
            oldTempConversation.updatedAt = new Date().toISOString(); 
            
            wsState.activeConversations.set(permanentConversationId, oldTempConversation);
            finalConversationId = permanentConversationId;

            wsState.conversationRequirements.set(permanentConversationId, wsState.conversationRequirements.get(conversationId) || '');
            wsState.conversationContextPaths.set(permanentConversationId, wsState.conversationContextPaths.get(conversationId) || []);
            wsState.conversationModelSelection.set(permanentConversationId, wsState.conversationModelSelection.get(conversationId) || '');
            wsState.isSendingMap.set(permanentConversationId, wsState.isSendingMap.get(conversationId) || false);
            wsState.isSubscribedMap.set(permanentConversationId, wsState.isSubscribedMap.get(conversationId) || false);

            wsState.conversationRequirements.delete(conversationId);
            wsState.conversationContextPaths.delete(conversationId); 
            wsState.conversationModelSelection.delete(conversationId);
            wsState.isSendingMap.delete(conversationId);
            wsState.isSubscribedMap.delete(conversationId);
            
            if (wsState.selectedConversationId === conversationId) {
              wsState.selectedConversationId = permanentConversationId;
            }
          }
          
          wsState.conversationContextPaths.set(finalConversationId, []);
          wsState.conversationRequirements.set(finalConversationId, ''); 

          this.subscribeToStepResponse(workspaceId, currentConversation.stepId, finalConversationId);

          const conversationHistoryStore = useConversationHistoryStore();
          const workflowStore = useWorkflowStore();
          if (conversationHistoryStore.stepName === workflowStore.getStepNameById(currentConversation.stepId)) {
             await conversationHistoryStore.fetchConversationHistory();
          }
        } else {
          wsState.isSendingMap.set(conversationId, false); 
          throw new Error('Failed to send step requirement: No conversation ID returned.');
        }
      } catch (error) {
        console.error('Error sending step requirement:', error);
        wsState.isSendingMap.set(conversationId, false); 
        throw error;
      }
    },

    subscribeToStepResponse(workspaceId: string, stepId: string, conversationId: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const { onResult, onError, stop } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(
        StepResponseSubscription, { workspaceId, stepId, conversationId }
      );
      wsState.isSubscribedMap.set(conversationId, true);

      onResult(({ data }) => {
        wsState.isSendingMap.set(conversationId, false); 
        if (data?.stepResponse) {
          const { conversationId: respConvId, messageChunk, isComplete, promptTokens, completionTokens, promptCost, completionCost } = data.stepResponse;
          const conv = wsState.activeConversations.get(respConvId);
          if(conv) conv.updatedAt = new Date().toISOString();

          this.appendToMessageInConversation(respConvId, messageChunk, isComplete, promptTokens, completionTokens, promptCost, completionCost);
          if (isComplete) {
            stop(); 
            wsState.isSubscribedMap.set(conversationId, false);
          }
        }
      });

      onError((error) => {
        console.error(`Subscription error for conversation ${conversationId}:`, error);
        wsState.isSendingMap.set(conversationId, false);
        wsState.isSubscribedMap.set(conversationId, false);
        const errorMsg = `Error receiving AI response: ${error.message}`;
        if (wsState.activeConversations.has(conversationId)){
            const conv = wsState.activeConversations.get(conversationId)!;
            conv.updatedAt = new Date().toISOString();
            this.appendToMessageInConversation(conversationId, errorMsg, true);
        }
      });
    },

    appendToMessageInConversation(
      conversationId: string, messageChunk: string | null, isComplete: boolean,
      promptTokens?: number | null, completionTokens?: number | null, promptCost?: number | null, completionCost?: number | null
    ) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const conversation = wsState.activeConversations.get(conversationId);
      if (!conversation) return;

      let lastMessage = conversation.messages[conversation.messages.length - 1] as AIMessage | undefined;

      if (messageChunk || (!lastMessage || lastMessage?.type !== 'ai' || lastMessage?.isComplete)) {
         if (!lastMessage || lastMessage.type !== 'ai' || lastMessage.isComplete) {
            const segments: AIResponseSegment[] = [];
            const newAiMessage: AIMessage = {
              type: 'ai', text: '', timestamp: new Date(), chunks: messageChunk ? [messageChunk] : [],
              isComplete: false, segments, parserInstance: new IncrementalAIResponseParser(segments)
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
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.fileUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },

    addContextFilePath(contextFilePath: ContextFilePath) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.selectedConversationId) {
        const currentPaths = wsState.conversationContextPaths.get(wsState.selectedConversationId) || [];
        wsState.conversationContextPaths.set(wsState.selectedConversationId, [...currentPaths, contextFilePath]);
        const conv = wsState.activeConversations.get(wsState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    removeContextFilePath(index: number) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.selectedConversationId) {
        const currentPaths = wsState.conversationContextPaths.get(wsState.selectedConversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        wsState.conversationContextPaths.set(wsState.selectedConversationId, newPaths);
        const conv = wsState.activeConversations.get(wsState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    clearContextFilePaths() {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.selectedConversationId) {
        wsState.conversationContextPaths.set(wsState.selectedConversationId, []);
        const conv = wsState.activeConversations.get(wsState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    setConversationFromHistory(historicalConversationData: Conversation) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
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
          messageCopy.text && parser.processChunks([messageCopy.text]);
          messageCopy.segments = segments;
          messageCopy.parserInstance = parser;
          messageCopy.isComplete = true; 
        }
        return messageCopy;
      });

      const newConversation: Conversation = {
        ...historicalConversationData, id: tempId, stepId: stepIdToUse, messages: copiedMessages,
        createdAt: historicalConversationData.createdAt || now, updatedAt: now,
      };

      wsState.activeConversations.set(tempId, newConversation);
      wsState.conversationRequirements.set(tempId, ''); 
      wsState.conversationContextPaths.set(tempId, []);
      wsState.conversationModelSelection.set(tempId, ''); 
      wsState.isSendingMap.set(tempId, false);
      wsState.isSubscribedMap.set(tempId, false);
      wsState.selectedConversationId = tempId;
    },
    
    async searchContextFiles(requirement: string): Promise<void> {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;

      if (!workspaceId || !wsState.selectedConversationId) {
        throw new Error('No workspace or conversation selected for context search.');
      }
      const targetConversationId = wsState.selectedConversationId;

      try {
        const result = await new Promise<SearchContextFilesQuery | null>((resolve, reject) => {
            const { onResult, onError: onQueryError } = useQuery<SearchContextFilesQuery, SearchContextFilesQueryVariables>(
              SearchContextFiles, { workspaceId, query: requirement }, { fetchPolicy: 'network-only' } 
            );
            onResult(queryResult => resolve(queryResult.data || null));
            onQueryError(error => reject(error));
        });
          
        const paths = result?.hackathonSearch?.map(path => ({ path, type: 'text' as const })) || [];
        wsState.conversationContextPaths.set(targetConversationId, paths);
        const conv = wsState.activeConversations.get(targetConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();

      } catch (err) {
        console.error('Error searching context files:', err);
        if (wsState.selectedConversationId === targetConversationId) { 
            wsState.conversationContextPaths.set(targetConversationId, []);
            const conv = wsState.activeConversations.get(targetConversationId);
            if (conv) conv.updatedAt = new Date().toISOString();
        }
        throw err;
      }
    },
    
    ensureConversationForStep(stepId: string): void {
      if (!stepId) {
          console.warn("ensureConversationForStep called without stepId");
          return;
      }
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const currentSelectedConv = this.selectedConversation;

      if (!currentSelectedConv || currentSelectedConv.stepId !== stepId) {
          const conversationsForStep = Array.from(wsState.activeConversations.values())
              .filter(c => c.stepId === stepId);
          
          if (conversationsForStep.length > 0) {
              wsState.selectedConversationId = conversationsForStep[conversationsForStep.length - 1].id;
          } else {
              this.createTemporaryConversation(stepId);
          }
      }
    },
  },
});
