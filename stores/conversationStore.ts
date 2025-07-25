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
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import type { AIResponseSegment, ToolCallSegment } from '~/utils/aiResponseParser/types';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import { AgentInstanceContext } from '~/types/agentInstanceContext';
import { createParserContext } from '~/utils/aiResponseParser/parserContextFactory';

// REFACTORED: This state is now per-agent-launch-profile
interface ProfileConversationState {
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

// REFACTORED: The store's state is keyed by agent launch profile ID
interface ConversationStoreState {
  conversationsByLaunchProfile: Map<string, ProfileConversationState>;
}

const createDefaultProfileState = (): ProfileConversationState => ({
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
    conversationsByLaunchProfile: new Map(),
  }),

  getters: {
    // REFACTORED: Helper getter to safely access the current active agent launch profile's state
    _currentProfileState(state): ProfileConversationState | null {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) return null;
      return state.conversationsByLaunchProfile.get(activeProfileId) || null;
    },

    allOpenConversations(): Conversation[] {
      return this._currentProfileState ? Array.from(this._currentProfileState.activeConversations.values()) : [];
    },

    selectedConversation(): Conversation | null {
      if (!this._currentProfileState || !this._currentProfileState.selectedConversationId) return null;
      return this._currentProfileState.activeConversations.get(this._currentProfileState.selectedConversationId) || null;
    },

    selectedConversationId(): string | null {
      return this._currentProfileState?.selectedConversationId || null;
    },

    currentContextPaths(): ContextFilePath[] {
      if (!this.selectedConversationId || !this._currentProfileState) return [];
      return this._currentProfileState.conversationContextPaths.get(this.selectedConversationId) || [];
    },

    currentModelSelection(): string {
      if (!this.selectedConversationId || !this._currentProfileState) return '';
      return this._currentProfileState.conversationModelSelection.get(this.selectedConversationId) || '';
    },

    isCurrentlySending(): boolean {
      if (!this.selectedConversationId || !this._currentProfileState) return false;
      return !!this._currentProfileState.isSendingMap.get(this.selectedConversationId);
    },

    conversationMessages(): Message[] {
      return this.selectedConversation ? this.selectedConversation.messages : [];
    },

    currentRequirement(): string {
      if (!this.selectedConversationId || !this._currentProfileState) return '';
      return this._currentProfileState.conversationRequirements.get(this.selectedConversationId) || '';
    },

    // NEW: Getters for agent settings
    currentAutoExecuteTools(): boolean {
      if (!this.selectedConversationId || !this._currentProfileState) return false;
      // Use nullish coalescing to return false if the key doesn't exist for the conversation
      return this._currentProfileState.conversationAutoExecuteTools.get(this.selectedConversationId) ?? false;
    },

    currentUseXmlToolFormat(): boolean {
      if (!this.selectedConversationId || !this._currentProfileState) return false;
      // Use nullish coalescing to return false if the key doesn't exist for the conversation
      return this._currentProfileState.conversationUseXmlToolFormat.get(this.selectedConversationId) ?? false;
    },

    // ADDED: Getter for parsing toggle
    currentParseToolCalls(): boolean {
      if (!this.selectedConversationId || !this._currentProfileState) return true;
      // Default to true if not set, as per requirements
      return this._currentProfileState.conversationParseToolCalls.get(this.selectedConversationId) ?? true;
    },

    // FIXED: This getter now searches across all profiles to find the context.
    getInstanceContextForConversation: (state) => (conversationId: string): AgentInstanceContext | undefined => {
      for (const profileState of state.conversationsByLaunchProfile.values()) {
        if (profileState.agentInstanceContextsMap.has(conversationId)) {
          return profileState.agentInstanceContextsMap.get(conversationId);
        }
      }
      return undefined;
    },
  },

  actions: {
    // REFACTORED: Helper action to get or create state for the current agent launch profile
    _getOrCreateCurrentProfileState(): ProfileConversationState {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) {
        throw new Error("Cannot get conversation state: No agent launch profile is active.");
      }
      if (!this.conversationsByLaunchProfile.has(activeProfileId)) {
        this.conversationsByLaunchProfile.set(activeProfileId, createDefaultProfileState());
      }
      return this.conversationsByLaunchProfile.get(activeProfileId)!;
    },

    setSelectedConversationId(conversationId: string | null) {
      try {
        const profileState = this._getOrCreateCurrentProfileState();
        profileState.selectedConversationId = conversationId;
      } catch (e) {
        console.error(e);
      }
    },

    createNewConversation() {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        console.error('Cannot create new conversation without an active launch profile.');
        return;
      }
      const profileState = this._getOrCreateCurrentProfileState();
      
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const newConversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: now,
        updatedAt: now,
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };

      profileState.activeConversations.set(tempId, newConversation);
      profileState.conversationRequirements.set(tempId, '');
      profileState.conversationContextPaths.set(tempId, []);
      profileState.conversationModelSelection.set(tempId, '');
      profileState.isSendingMap.set(tempId, false);
      profileState.isSubscribedMap.set(tempId, false);
      // Set default agent settings for new conversations
      profileState.conversationAutoExecuteTools.set(tempId, false);
      profileState.conversationUseXmlToolFormat.set(tempId, true); // UPDATED: Default to true as per new requirement
      profileState.conversationParseToolCalls.set(tempId, true); // ADDED
      profileState.agentInstanceContextsMap.set(tempId, new AgentInstanceContext(tempId)); // ADDED FOR UNIQUE IDs
      profileState.selectedConversationId = tempId;
    },

    updateUserRequirement(newRequirement: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationRequirements.set(profileState.selectedConversationId, newRequirement);
      }
    },

    updateModelSelection(newModel: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationModelSelection.set(profileState.selectedConversationId, newModel);
      }
    },

    // NEW: Actions to update agent settings
    updateAutoExecuteTools(autoExecute: boolean) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationAutoExecuteTools.set(profileState.selectedConversationId, autoExecute);
      }
    },

    updateUseXmlToolFormat(useXml: boolean) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationUseXmlToolFormat.set(profileState.selectedConversationId, useXml);
      }
    },

    // ADDED: Action to update parsing toggle
    updateParseToolCalls(parse: boolean) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationParseToolCalls.set(profileState.selectedConversationId, parse);
      }
    },
    
    async closeConversation(conversationIdToClose: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      
      const unsubscribe = profileState.subscriptionUnsubscribeMap.get(conversationIdToClose);
      if (unsubscribe) {
        unsubscribe();
        profileState.subscriptionUnsubscribeMap.delete(conversationIdToClose);
        profileState.isSubscribedMap.delete(conversationIdToClose);
      }

      const conversationToClose = profileState.activeConversations.get(conversationIdToClose);
      if (!conversationToClose) return;

      profileState.activeConversations.delete(conversationIdToClose);
      profileState.conversationRequirements.delete(conversationIdToClose);
      profileState.conversationContextPaths.delete(conversationIdToClose);
      profileState.conversationModelSelection.delete(conversationIdToClose);
      profileState.isSendingMap.delete(conversationIdToClose);
      profileState.conversationAutoExecuteTools.delete(conversationIdToClose);
      profileState.conversationUseXmlToolFormat.delete(conversationIdToClose);
      profileState.conversationParseToolCalls.delete(conversationIdToClose); // ADDED
      profileState.agentInstanceContextsMap.delete(conversationIdToClose); // ADDED FOR UNIQUE IDs

      if (profileState.selectedConversationId === conversationIdToClose) {
        const openConversationsArray = Array.from(profileState.activeConversations.values());
        if (openConversationsArray.length > 0) {
          profileState.selectedConversationId = openConversationsArray[openConversationsArray.length - 1].id;
        } else {
          profileState.selectedConversationId = null;
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
      const profileState = this._getOrCreateCurrentProfileState();
      const conversation = profileState.activeConversations.get(conversationId);
      if (!conversation) {
        console.error(`Conversation ${conversationId} not found to add message.`);
        return;
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
    },

    async sendUserInputAndSubscribe(): Promise<void> {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        throw new Error("Cannot send input: No active launch profile.");
      }
      
      const profileState = this._getOrCreateCurrentProfileState();
      const currentConversation = this.selectedConversation;
      if (!currentConversation) {
        throw new Error('No active conversation selected.');
      }
      const conversationId = currentConversation.id;
      
      currentConversation.updatedAt = new Date().toISOString();
      
      const isNewConversation = conversationId.startsWith('temp-');
      const conversationIdForRequest = isNewConversation ? null : conversationId;
      const currentRequirementText = profileState.conversationRequirements.get(conversationId) || '';
      const contextPaths = profileState.conversationContextPaths.get(conversationId) || [];
      const autoExecuteTools = profileState.conversationAutoExecuteTools.get(conversationId) ?? false;
      const useXmlToolFormat = profileState.conversationUseXmlToolFormat.get(conversationId) ?? false;
      const parseToolCalls = profileState.conversationParseToolCalls.get(conversationId) ?? true; // ADDED
      
      let llmModelName: string | null = null;
      let agentDefinitionId: string | null = null;
      let workspaceId: string | null = null;

      if (isNewConversation) {
        llmModelName = profileState.conversationModelSelection.get(conversationId) || null;
        if (!llmModelName) {
            console.error("Model not selected for the first message.");
            throw new Error("Please select a model for the first message.");
        }
        agentDefinitionId = activeLaunchProfile.agentDefinition.id;
        workspaceId = activeLaunchProfile.workspaceId; // Get workspaceId for new conversations
        currentConversation.llmModelName = llmModelName; // Set model name on conversation
        currentConversation.useXmlToolFormat = useXmlToolFormat; // Set useXml on conversation
        currentConversation.parseToolCalls = parseToolCalls; // ADDED
      }

      const { mutate: sendAgentUserInputMutation } = useMutation<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>(SendAgentUserInput);
      profileState.isSendingMap.set(conversationId, true);

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
            const oldTempConversation = profileState.activeConversations.get(conversationId)!;
            
            profileState.activeConversations.delete(conversationId);
            oldTempConversation.id = permanentAgentId;
            oldTempConversation.updatedAt = new Date().toISOString(); 
            profileState.activeConversations.set(permanentAgentId, oldTempConversation);
            finalConversationId = permanentAgentId;

            // ADDED FOR UNIQUE IDs
            const instanceContext = profileState.agentInstanceContextsMap.get(conversationId);
            if (instanceContext) {
              instanceContext.updateId(permanentAgentId);
              profileState.agentInstanceContextsMap.set(permanentAgentId, instanceContext);
              profileState.agentInstanceContextsMap.delete(conversationId);
            }

            profileState.conversationRequirements.set(permanentAgentId, profileState.conversationRequirements.get(conversationId) || '');
            profileState.conversationContextPaths.set(permanentAgentId, profileState.conversationContextPaths.get(conversationId) || []);
            profileState.conversationModelSelection.set(permanentAgentId, profileState.conversationModelSelection.get(conversationId) || '');
            profileState.isSendingMap.set(permanentAgentId, profileState.isSendingMap.get(conversationId) || false);
            profileState.isSubscribedMap.set(permanentAgentId, profileState.isSubscribedMap.get(conversationId) || false);
            profileState.conversationAutoExecuteTools.set(permanentAgentId, profileState.conversationAutoExecuteTools.get(conversationId) ?? false);
            profileState.conversationUseXmlToolFormat.set(permanentAgentId, profileState.conversationUseXmlToolFormat.get(conversationId) ?? false);
            profileState.conversationParseToolCalls.set(permanentAgentId, profileState.conversationParseToolCalls.get(conversationId) ?? true); // ADDED

            profileState.conversationRequirements.delete(conversationId);
            profileState.conversationContextPaths.delete(conversationId); 
            profileState.conversationModelSelection.delete(conversationId);
            profileState.isSendingMap.delete(conversationId);
            profileState.isSubscribedMap.delete(conversationId);
            profileState.conversationAutoExecuteTools.delete(conversationId);
            profileState.conversationUseXmlToolFormat.delete(conversationId);
            profileState.conversationParseToolCalls.delete(conversationId); // ADDED
            
            if (profileState.selectedConversationId === conversationId) {
              profileState.selectedConversationId = permanentAgentId;
            }
          }
          
          profileState.conversationContextPaths.set(finalConversationId, []);
          profileState.conversationRequirements.set(finalConversationId, ''); 

          // UPDATED: Only subscribe if not already subscribed
          if (!profileState.isSubscribedMap.get(finalConversationId)) {
            this.subscribeToAgentResponse(finalConversationId);
          }

          const conversationHistoryStore = useConversationHistoryStore();
          if (conversationHistoryStore.agentDefinitionId === activeLaunchProfile.agentDefinition.id) {
             await conversationHistoryStore.fetchConversationHistory();
          }
        } else {
          profileState.isSendingMap.set(conversationId, false); 
          throw new Error('Failed to send user input: No data returned.');
        }
      } catch (error) {
        console.error('Error sending user input:', error);
        profileState.isSendingMap.set(conversationId, false); 
        throw error;
      }
    },

    subscribeToAgentResponse(agentId: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      const { onResult, onError, stop } = useSubscription<AgentResponseSubscriptionType, AgentResponseSubscriptionVariables>(
        AgentResponseSubscription, { agentId }
      );
      
      profileState.isSubscribedMap.set(agentId, true);
      profileState.subscriptionUnsubscribeMap.set(agentId, stop);

      onResult(({ data }) => {
        profileState.isSendingMap.set(agentId, false);
        if (!data?.agentResponse) return;

        const { agentId: respAgentId, data: eventData } = data.agentResponse;
        const conversation = profileState.activeConversations.get(respAgentId);
        if (!conversation) return;

        conversation.updatedAt = new Date().toISOString();

        if (eventData) {
          processAgentResponseEvent(eventData, conversation);
        }
      });

      onError((error) => {
        console.error(`Subscription error for agent ${agentId}:`, error);
        stop();
        profileState.isSubscribedMap.set(agentId, false);
        profileState.subscriptionUnsubscribeMap.delete(agentId);
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
        const profileState = this._getOrCreateCurrentProfileState();
        const conversation = profileState.activeConversations.get(agentId);
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

    addContextFilePath(contextFilePath: ContextFilePath) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        const currentPaths = profileState.conversationContextPaths.get(profileState.selectedConversationId) || [];
        profileState.conversationContextPaths.set(profileState.selectedConversationId, [...currentPaths, contextFilePath]);
        const conv = profileState.activeConversations.get(profileState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    removeContextFilePath(index: number) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        const currentPaths = profileState.conversationContextPaths.get(profileState.selectedConversationId) || [];
        const newPaths = [...currentPaths];
        newPaths.splice(index, 1);
        profileState.conversationContextPaths.set(profileState.selectedConversationId, newPaths);
        const conv = profileState.activeConversations.get(profileState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString(); 
      }
    },

    clearContextFilePaths() {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.selectedConversationId) {
        profileState.conversationContextPaths.set(profileState.selectedConversationId, []);
        const conv = profileState.activeConversations.get(profileState.selectedConversationId);
        if (conv) conv.updatedAt = new Date().toISOString();
      }
    },

    setConversationFromHistory(historicalConversationData: Conversation) {
      const profileState = this._getOrCreateCurrentProfileState();
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        console.error("Cannot set conversation from history: No active launch profile.");
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
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };

      profileState.activeConversations.set(tempId, newConversation);
      profileState.conversationRequirements.set(tempId, ''); 
      profileState.conversationContextPaths.set(tempId, []);
      profileState.conversationModelSelection.set(tempId, historicalConversationData.llmModelName || ''); 
      profileState.isSendingMap.set(tempId, false);
      profileState.isSubscribedMap.set(tempId, false);
      profileState.conversationAutoExecuteTools.set(tempId, false);
      profileState.conversationUseXmlToolFormat.set(tempId, (historicalConversationData as any).useXmlToolFormat ?? true);
      profileState.conversationParseToolCalls.set(tempId, (historicalConversationData as any).parseToolCalls ?? true);
      // Store the context for the new temp conversation
      profileState.agentInstanceContextsMap.set(tempId, agentInstanceContext);
      profileState.selectedConversationId = tempId;
    },
    
    ensureConversationForLaunchProfile(profileId: string): void {
      if (!profileId) {
        console.warn("ensureConversationForLaunchProfile called without a profile ID.");
        return;
      }
      
      if (!this.conversationsByLaunchProfile.has(profileId)) {
        this.conversationsByLaunchProfile.set(profileId, createDefaultProfileState());
      }
      const profileState = this.conversationsByLaunchProfile.get(profileId)!;

      const conversations = Array.from(profileState.activeConversations.values());

      if (conversations.length > 0) {
        const sortedConversations = conversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        profileState.selectedConversationId = sortedConversations[0].id;
      } else {
        this.createNewConversation();
      }
    },
  },
});
