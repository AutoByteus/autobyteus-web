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
import type { Conversation, Message, ContextFilePath, AIMessage } from '~/types/conversation';
import apiService from '~/services/api';
import { useAgentSessionStore } from '~/stores/agentSessionStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import type { AIResponseSegment, ToolCallSegment } from '~/utils/aiResponseParser/types';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import { AgentInstanceContext } from '~/types/agentInstanceContext';
import { createParserContext } from '~/utils/aiResponseParser/parserContextFactory';

// REFACTORED: This state is now per-agent-session
interface SessionConversationState {
  activeConversations: Map<string, Conversation>; 
  selectedConversationId: string | null; 
  conversationRequirements: Map<string, string>; 
  conversationContextPaths: Map<string, ContextFilePath[]>; 
  conversationModelSelection: Map<string, string>; 
  isSendingMap: Map<string, boolean>;
  isSubscribedMap: Map<string, boolean>;
  // NEW: Configurable agent settings
  conversationAutoExecuteTools: Map<string, boolean>;
  conversationUseXmlToolFormat: Map<string, boolean>;
  conversationParseToolCalls: Map<string, boolean>; // ADDED
  subscriptionUnsubscribeMap: Map<string, () => void>; // ADDED
  agentInstanceContextsMap: Map<string, AgentInstanceContext>; // ADDED FOR UNIQUE IDs
}

// REFACTORED: The store's state is keyed by agent session ID
interface ConversationStoreState {
  conversationsByAgentSession: Map<string, SessionConversationState>;
}

const createDefaultSessionState = (): SessionConversationState => ({
  activeConversations: new Map(),
  selectedConversationId: null,
  conversationRequirements: new Map(),
  conversationContextPaths: new Map(),
  conversationModelSelection: new Map(),
  isSendingMap: new Map(),
  isSubscribedMap: new Map(),
  // NEW: Initialize maps for agent settings
  conversationAutoExecuteTools: new Map(),
  conversationUseXmlToolFormat: new Map(),
  conversationParseToolCalls: new Map(), // ADDED
  subscriptionUnsubscribeMap: new Map(), // ADDED
  agentInstanceContextsMap: new Map(), // ADDED FOR UNIQUE IDs
});

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationStoreState => ({
    conversationsByAgentSession: new Map(),
  }),

  getters: {
    // REFACTORED: Helper getter to safely access the current active agent session's state
    _currentSessionState(state): SessionConversationState | null {
      const agentSessionStore = useAgentSessionStore();
      const activeSessionId = agentSessionStore.activeSessionId;
      if (!activeSessionId) return null;
      return state.conversationsByAgentSession.get(activeSessionId) || null;
    },

    allOpenConversations(): Conversation[] {
      return this._currentSessionState ? Array.from(this._currentSessionState.activeConversations.values()) : [];
    },

    selectedConversation(): Conversation | null {
      if (!this._currentSessionState || !this._currentSessionState.selectedConversationId) return null;
      return this._currentSessionState.activeConversations.get(this._currentSessionState.selectedConversationId) || null;
    },

    selectedConversationId(): string | null {
      return this._currentSessionState?.selectedConversationId || null;
    },

    currentContextPaths(): ContextFilePath[] {
      if (!this.selectedConversationId || !this._currentSessionState) return [];
      return this._currentSessionState.conversationContextPaths.get(this.selectedConversationId) || [];
    },

    currentModelSelection(): string {
      if (!this.selectedConversationId || !this._currentSessionState) return '';
      return this._currentSessionState.conversationModelSelection.get(this.selectedConversationId) || '';
    },

    isCurrentlySending(): boolean {
      if (!this.selectedConversationId || !this._currentSessionState) return false;
      return !!this._currentSessionState.isSendingMap.get(this.selectedConversationId);
    },

    conversationMessages(): Message[] {
      return this.selectedConversation ? this.selectedConversation.messages : [];
    },

    currentRequirement(): string {
      if (!this.selectedConversationId || !this._currentSessionState) return '';
      return this._currentSessionState.conversationRequirements.get(this.selectedConversationId) || '';
    },

    // NEW: Getters for agent settings
    currentAutoExecuteTools(): boolean {
      if (!this.selectedConversationId || !this._currentSessionState) return false;
      // Use nullish coalescing to return false if the key doesn't exist for the conversation
      return this._currentSessionState.conversationAutoExecuteTools.get(this.selectedConversationId) ?? false;
    },

    currentUseXmlToolFormat(): boolean {
      if (!this.selectedConversationId || !this._currentSessionState) return false;
      // Use nullish coalescing to return false if the key doesn't exist for the conversation
      return this._currentSessionState.conversationUseXmlToolFormat.get(this.selectedConversationId) ?? false;
    },

    // ADDED: Getter for parsing toggle
    currentParseToolCalls(): boolean {
      if (!this.selectedConversationId || !this._currentSessionState) return true;
      // Default to true if not set, as per requirements
      return this._currentSessionState.conversationParseToolCalls.get(this.selectedConversationId) ?? true;
    },

    // ADDED FOR UNIQUE IDs
    getInstanceContextForConversation: (state) => (conversationId: string): AgentInstanceContext | undefined => {
      const agentSessionStore = useAgentSessionStore();
      const activeSessionId = agentSessionStore.activeSessionId;
      if (!activeSessionId) return undefined;
      const sessionState = state.conversationsByAgentSession.get(activeSessionId);
      return sessionState?.agentInstanceContextsMap.get(conversationId);
    },
  },

  actions: {
    // REFACTORED: Helper action to get or create state for the current agent session
    _getOrCreateCurrentSessionState(): SessionConversationState {
      const agentSessionStore = useAgentSessionStore();
      const activeSessionId = agentSessionStore.activeSessionId;
      if (!activeSessionId) {
        throw new Error("Cannot get conversation state: No agent session is active.");
      }
      if (!this.conversationsByAgentSession.has(activeSessionId)) {
        this.conversationsByAgentSession.set(activeSessionId, createDefaultSessionState());
      }
      return this.conversationsByAgentSession.get(activeSessionId)!;
    },

    setSelectedConversationId(conversationId: string | null) {
      try {
        const sessionState = this._getOrCreateCurrentSessionState();
        sessionState.selectedConversationId = conversationId;
      } catch (e) {
        console.error(e);
      }
    },

    createNewConversation() {
      const agentSessionStore = useAgentSessionStore();
      const activeSession = agentSessionStore.activeSession;
      if (!activeSession) {
        console.error('Cannot create new conversation without an active session.');
        return;
      }
      const sessionState = this._getOrCreateCurrentSessionState();
      
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const newConversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: now,
        updatedAt: now,
        agentDefinitionId: activeSession.agentDefinition.id,
      };

      sessionState.activeConversations.set(tempId, newConversation);
      sessionState.conversationRequirements.set(tempId, '');
      sessionState.conversationContextPaths.set(tempId, []);
      sessionState.conversationModelSelection.set(tempId, '');
      sessionState.isSendingMap.set(tempId, false);
      sessionState.isSubscribedMap.set(tempId, false);
      // Set default agent settings for new conversations
      sessionState.conversationAutoExecuteTools.set(tempId, false);
      sessionState.conversationUseXmlToolFormat.set(tempId, true); // UPDATED: Default to true as per new requirement
      sessionState.conversationParseToolCalls.set(tempId, true); // ADDED
      sessionState.agentInstanceContextsMap.set(tempId, new AgentInstanceContext(tempId)); // ADDED FOR UNIQUE IDs
      sessionState.selectedConversationId = tempId;
    },

    updateUserRequirement(newRequirement: string) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationRequirements.set(sessionState.selectedConversationId, newRequirement);
      }
    },

    updateModelSelection(newModel: string) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationModelSelection.set(sessionState.selectedConversationId, newModel);
      }
    },

    // NEW: Actions to update agent settings
    updateAutoExecuteTools(autoExecute: boolean) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationAutoExecuteTools.set(sessionState.selectedConversationId, autoExecute);
      }
    },

    updateUseXmlToolFormat(useXml: boolean) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationUseXmlToolFormat.set(sessionState.selectedConversationId, useXml);
      }
    },

    // ADDED: Action to update parsing toggle
    updateParseToolCalls(parse: boolean) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationParseToolCalls.set(sessionState.selectedConversationId, parse);
      }
    },
    
    async closeConversation(conversationIdToClose: string) {
      const sessionState = this._getOrCreateCurrentSessionState();
      
      const unsubscribe = sessionState.subscriptionUnsubscribeMap.get(conversationIdToClose);
      if (unsubscribe) {
        unsubscribe();
        sessionState.subscriptionUnsubscribeMap.delete(conversationIdToClose);
        sessionState.isSubscribedMap.delete(conversationIdToClose);
      }

      const conversationToClose = sessionState.activeConversations.get(conversationIdToClose);
      if (!conversationToClose) return;

      sessionState.activeConversations.delete(conversationIdToClose);
      sessionState.conversationRequirements.delete(conversationIdToClose);
      sessionState.conversationContextPaths.delete(conversationIdToClose);
      sessionState.conversationModelSelection.delete(conversationIdToClose);
      sessionState.isSendingMap.delete(conversationIdToClose);
      sessionState.conversationAutoExecuteTools.delete(conversationIdToClose);
      sessionState.conversationUseXmlToolFormat.delete(conversationIdToClose);
      sessionState.conversationParseToolCalls.delete(conversationIdToClose); // ADDED
      sessionState.agentInstanceContextsMap.delete(conversationIdToClose); // ADDED FOR UNIQUE IDs

      if (sessionState.selectedConversationId === conversationIdToClose) {
        const openConversationsArray = Array.from(sessionState.activeConversations.values());
        if (openConversationsArray.length > 0) {
          sessionState.selectedConversationId = openConversationsArray[openConversationsArray.length - 1].id;
        } else {
          sessionState.selectedConversationId = null;
        }
      }

      if (!conversationIdToClose.startsWith('temp-')) {
        try {
          const { mutate: terminateAgentInstanceMutation } = useMutation(TerminateAgentInstance);
          await terminateAgentInstanceMutation({ id: conversationIdToClose });
        } catch (error) {
          console.error('Error closing conversation on backend (terminating agent):', error);
        }
      }
    },

    addMessageToConversation(conversationId: string, message: Message) {
      const sessionState = this._getOrCreateCurrentSessionState();
      const conversation = sessionState.activeConversations.get(conversationId);
      if (!conversation) {
        console.error(`Conversation ${conversationId} not found to add message.`);
        return;
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
    },

    async sendUserInputAndSubscribe(): Promise<void> {
      const agentSessionStore = useAgentSessionStore();
      const activeSession = agentSessionStore.activeSession;
      if (!activeSession) {
        throw new Error("Cannot send input: No active agent session.");
      }
      
      const sessionState = this._getOrCreateCurrentSessionState();
      const currentConversation = this.selectedConversation;
      if (!currentConversation) {
        throw new Error('No active conversation selected.');
      }
      const conversationId = currentConversation.id;
      
      currentConversation.updatedAt = new Date().toISOString();
      
      const isNewConversation = conversationId.startsWith('temp-');
      const conversationIdForRequest = isNewConversation ? null : conversationId;
      const currentRequirementText = sessionState.conversationRequirements.get(conversationId) || '';
      const contextPaths = sessionState.conversationContextPaths.get(conversationId) || [];
      const autoExecuteTools = sessionState.conversationAutoExecuteTools.get(conversationId) ?? false;
      const useXmlToolFormat = sessionState.conversationUseXmlToolFormat.get(conversationId) ?? false;
      const parseToolCalls = sessionState.conversationParseToolCalls.get(conversationId) ?? true; // ADDED
      
      let llmModelName: string | null = null;
      let agentDefinitionId: string | null = null;
      let workspaceId: string | null = null;

      if (isNewConversation) {
        llmModelName = sessionState.conversationModelSelection.get(conversationId) || null;
        if (!llmModelName) {
            console.error("Model not selected for the first message.");
            throw new Error("Please select a model for the first message.");
        }
        agentDefinitionId = activeSession.agentDefinition.id;
        workspaceId = activeSession.workspaceId; // Get workspaceId for new conversations
        currentConversation.llmModelName = llmModelName; // Set model name on conversation
        currentConversation.useXmlToolFormat = useXmlToolFormat; // Set useXml on conversation
        currentConversation.parseToolCalls = parseToolCalls; // ADDED
      }

      const { mutate: sendAgentUserInputMutation } = useMutation<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>(SendAgentUserInput);
      sessionState.isSendingMap.set(conversationId, true);

      try {
        const result = await sendAgentUserInputMutation({
          input: {
            userInput: {
              content: currentRequirementText,
              contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
            },
            agentId: conversationIdForRequest,
            agentDefinitionId,
            llmModelName,
            autoExecuteTools, 
            useXmlToolFormat,
            workspaceId,
          }
        });

        if (result?.data?.sendAgentUserInput) {
          const permanentAgentId = result.data.sendAgentUserInput.agentId;
          if (!permanentAgentId) {
            throw new Error('Failed to send user input: No agentId returned.');
          }

          let finalConversationId = conversationId;

          this.addMessageToConversation(conversationId, { 
            type: 'user', text: currentRequirementText, timestamp: new Date(), contextFilePaths: contextPaths
          });
          
          if (isNewConversation) {
            const oldTempConversation = sessionState.activeConversations.get(conversationId)!;
            
            sessionState.activeConversations.delete(conversationId);
            oldTempConversation.id = permanentAgentId;
            oldTempConversation.updatedAt = new Date().toISOString(); 
            sessionState.activeConversations.set(permanentAgentId, oldTempConversation);
            finalConversationId = permanentAgentId;

            // ADDED FOR UNIQUE IDs
            const instanceContext = sessionState.agentInstanceContextsMap.get(conversationId);
            if (instanceContext) {
              instanceContext.updateId(permanentAgentId);
              sessionState.agentInstanceContextsMap.set(permanentAgentId, instanceContext);
              sessionState.agentInstanceContextsMap.delete(conversationId);
            }

            sessionState.conversationRequirements.set(permanentAgentId, sessionState.conversationRequirements.get(conversationId) || '');
            sessionState.conversationContextPaths.set(permanentAgentId, sessionState.conversationContextPaths.get(conversationId) || []);
            sessionState.conversationModelSelection.set(permanentAgentId, sessionState.conversationModelSelection.get(conversationId) || '');
            sessionState.isSendingMap.set(permanentAgentId, sessionState.isSendingMap.get(conversationId) || false);
            sessionState.isSubscribedMap.set(permanentAgentId, sessionState.isSubscribedMap.get(conversationId) || false);
            sessionState.conversationAutoExecuteTools.set(permanentAgentId, sessionState.conversationAutoExecuteTools.get(conversationId) ?? false);
            sessionState.conversationUseXmlToolFormat.set(permanentAgentId, sessionState.conversationUseXmlToolFormat.get(conversationId) ?? false);
            sessionState.conversationParseToolCalls.set(permanentAgentId, sessionState.conversationParseToolCalls.get(conversationId) ?? true); // ADDED

            sessionState.conversationRequirements.delete(conversationId);
            sessionState.conversationContextPaths.delete(conversationId); 
            sessionState.conversationModelSelection.delete(conversationId);
            sessionState.isSendingMap.delete(conversationId);
            sessionState.isSubscribedMap.delete(conversationId);
            sessionState.conversationAutoExecuteTools.delete(conversationId);
            sessionState.conversationUseXmlToolFormat.delete(conversationId);
            sessionState.conversationParseToolCalls.delete(conversationId); // ADDED
            
            if (sessionState.selectedConversationId === conversationId) {
              sessionState.selectedConversationId = permanentAgentId;
            }
          }
          
          sessionState.conversationContextPaths.set(finalConversationId, []);
          sessionState.conversationRequirements.set(finalConversationId, ''); 

          // UPDATED: Only subscribe if not already subscribed
          if (!sessionState.isSubscribedMap.get(finalConversationId)) {
            this.subscribeToAgentResponse(finalConversationId);
          }

          const conversationHistoryStore = useConversationHistoryStore();
          if (conversationHistoryStore.agentDefinitionId === activeSession.agentDefinition.id) {
             await conversationHistoryStore.fetchConversationHistory();
          }
        } else {
          sessionState.isSendingMap.set(conversationId, false); 
          throw new Error('Failed to send user input: No data returned.');
        }
      } catch (error) {
        console.error('Error sending user input:', error);
        sessionState.isSendingMap.set(conversationId, false); 
        throw error;
      }
    },

    subscribeToAgentResponse(agentId: string) {
      const sessionState = this._getOrCreateCurrentSessionState();
      const { onResult, onError, stop } = useSubscription<AgentResponseSubscriptionType, AgentResponseSubscriptionVariables>(
        AgentResponseSubscription, { agentId }
      );
      
      sessionState.isSubscribedMap.set(agentId, true);
      sessionState.subscriptionUnsubscribeMap.set(agentId, stop);

      onResult(({ data }) => {
        sessionState.isSendingMap.set(agentId, false);
        if (!data?.agentResponse) return;

        const { agentId: respAgentId, data: eventData } = data.agentResponse;
        const conversation = sessionState.activeConversations.get(respAgentId);
        if (!conversation) return;

        conversation.updatedAt = new Date().toISOString();

        if (eventData) {
          processAgentResponseEvent(eventData, conversation);
        }
      });

      onError((error) => {
        console.error(`Subscription error for agent ${agentId}:`, error);
        stop();
        sessionState.isSubscribedMap.set(agentId, false);
        sessionState.subscriptionUnsubscribeMap.delete(agentId);
      });
    },

    async postToolExecutionApproval(agentId: string, invocationId: string, isApproved: boolean, reason: string | null = null) {
      const { mutate: approveToolInvocationMutation } = useMutation<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>(ApproveToolInvocation);
      try {
        const result = await approveToolInvocationMutation({
          input: {
            agentId,
            invocationId,
            isApproved,
            reason
          }
        });
        if (!result?.data?.approveToolInvocation?.success) {
          throw new Error(result?.data?.approveToolInvocation?.message || "Failed to post tool approval.");
        }
        // Also update the local state immediately for better UX
        const sessionState = this._getOrCreateCurrentSessionState();
        const conversation = sessionState.activeConversations.get(agentId);
        if (conversation) {
          const segment = conversation.messages
            .flatMap(m => m.type === 'ai' ? m.segments : [])
            .find(s => s.type === 'tool_call' && s.invocationId === invocationId) as ToolCallSegment | undefined;
          
          if (segment) {
            segment.status = isApproved ? 'executing' : 'denied';
          }
        }
      } catch (error) {
        console.error("Error posting tool execution approval:", error);
        // Here you might want to show an error to the user
      }
    },

    async uploadFile(file: File): Promise<string> {
      const agentSessionStore = useAgentSessionStore();
      const workspaceId = agentSessionStore.activeSession?.workspaceId;
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
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        const currentPaths = sessionState.conversationContextPaths.get(sessionState.selectedConversationId) || [];
        sessionState.conversationContextPaths.set(sessionState.selectedConversationId, [...currentPaths, contextFilePath]);
        const conv = sessionState.activeConversations.get(sessionState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    removeContextFilePath(index: number) {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        const currentPaths = sessionState.conversationContextPaths.get(sessionState.selectedConversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        sessionState.conversationContextPaths.set(sessionState.selectedConversationId, newPaths);
        const conv = sessionState.activeConversations.get(sessionState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    clearContextFilePaths() {
      const sessionState = this._getOrCreateCurrentSessionState();
      if (sessionState.selectedConversationId) {
        sessionState.conversationContextPaths.set(sessionState.selectedConversationId, []);
        const conv = sessionState.activeConversations.get(sessionState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    setConversationFromHistory(historicalConversationData: Conversation) {
      const sessionState = this._getOrCreateCurrentSessionState();
      const agentSessionStore = useAgentSessionStore();
      const activeSession = agentSessionStore.activeSession;
      if (!activeSession) {
        console.error("Cannot set conversation from history: No active session.");
        return;
      }
      
      const tempId = `temp-hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      // A new context is needed for the new temporary conversation to correctly parse its tool calls.
      const agentInstanceContext = new AgentInstanceContext(tempId);

      const copiedMessages = historicalConversationData.messages.map(m => {
        const messageCopy = { ...m };
        if (messageCopy.type === 'ai') {
          // MINIMAL CHANGE: Refactor to use the createParserContext factory
          const segments: AIResponseSegment[] = [];
          const parserContext = createParserContext(
            {
              llmModelName: historicalConversationData.llmModelName,
              useXmlToolFormat: historicalConversationData.useXmlToolFormat,
              parseToolCalls: historicalConversationData.parseToolCalls,
            },
            segments,
            agentInstanceContext
          );

          const parser = new IncrementalAIResponseParser(parserContext);
          messageCopy.text && parser.processChunks([messageCopy.text]);
          parser.finalize(); // Important for non-streaming content

          messageCopy.segments = segments;
          messageCopy.parserInstance = parser;
          messageCopy.isComplete = true; 
        }
        return messageCopy;
      });

      const newConversation: Conversation = {
        ...historicalConversationData, 
        id: tempId, 
        messages: copiedMessages,
        createdAt: historicalConversationData.createdAt || now, 
        updatedAt: now,
        agentDefinitionId: activeSession.agentDefinition.id,
      };

      sessionState.activeConversations.set(tempId, newConversation);
      sessionState.conversationRequirements.set(tempId, ''); 
      sessionState.conversationContextPaths.set(tempId, []);
      sessionState.conversationModelSelection.set(tempId, historicalConversationData.llmModelName || ''); 
      sessionState.isSendingMap.set(tempId, false);
      sessionState.isSubscribedMap.set(tempId, false);
      sessionState.conversationAutoExecuteTools.set(tempId, false);
      sessionState.conversationUseXmlToolFormat.set(tempId, (historicalConversationData as any).useXmlToolFormat ?? true);
      sessionState.conversationParseToolCalls.set(tempId, (historicalConversationData as any).parseToolCalls ?? true);
      // Store the context for the new temp conversation
      sessionState.agentInstanceContextsMap.set(tempId, agentInstanceContext);
      sessionState.selectedConversationId = tempId;
    },
    
    ensureConversationForSession(sessionId: string): void {
      if (!sessionId) {
        console.warn("ensureConversationForSession called without a session ID.");
        return;
      }
      
      if (!this.conversationsByAgentSession.has(sessionId)) {
        this.conversationsByAgentSession.set(sessionId, createDefaultSessionState());
      }
      const sessionState = this.conversationsByAgentSession.get(sessionId)!;

      const conversations = Array.from(sessionState.activeConversations.values());

      if (conversations.length > 0) {
        const latestConversation = conversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        sessionState.selectedConversationId = latestConversation.id;
      } else {
        this.createNewConversation();
      }
    },
  },
});
