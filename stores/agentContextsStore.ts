import { defineStore } from 'pinia';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { Conversation, Message, ContextFilePath, AIMessage } from '~/types/conversation';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { ParserContext } from '~/utils/aiResponseParser/stateMachine/ParserContext';

/**
 * @interface ProfileAgentState
 * @description Manages the state for all agent contexts associated with a single launch profile.
 * It tracks the active agents and which one is currently selected by the user in the UI.
 */
interface ProfileAgentState {
  activeAgents: Map<string, AgentContext>;
  selectedAgentId: string | null;
}

/**
 * @interface AgentContextsStoreState
 * @description The root state for this store, organizing all agent states by their launch profile ID.
 */
interface AgentContextsStoreState {
  agentsByLaunchProfile: Map<string, ProfileAgentState>;
}

// Helper function to create a clean initial state for a new profile.
const createDefaultProfileState = (): ProfileAgentState => ({
  activeAgents: new Map(),
  selectedAgentId: null,
});

/**
 * @store agentContexts
 * @description This store is the central repository for the state of all running agent contexts.
 * It is responsible for creating, updating, retrieving, and deleting agent contexts.
 * It does NOT handle any GraphQL communication; it is a pure state management store.
 */
export const useAgentContextsStore = defineStore('agentContexts', {
  state: (): AgentContextsStoreState => ({
    agentsByLaunchProfile: new Map(),
  }),

  getters: {
    /**
     * @getter _currentProfileState
     * @description (Internal) Safely retrieves the state object for the currently active launch profile.
     */
    _currentProfileState(state): ProfileAgentState | null {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) return null;
      return state.agentsByLaunchProfile.get(activeProfileId) || null;
    },

    /**
     * @getter allOpenAgents
     * @description Returns an array of all active agent contexts for the current launch profile.
     */
    allOpenAgents(): AgentContext[] {
      return this._currentProfileState ? Array.from(this._currentProfileState.activeAgents.values()) : [];
    },

    /**
     * @getter selectedAgent
     * @description Returns the currently selected agent context for the active launch profile.
     */
    selectedAgent(): AgentContext | null {
      if (!this._currentProfileState || !this._currentProfileState.selectedAgentId) return null;
      return this._currentProfileState.activeAgents.get(this._currentProfileState.selectedAgentId) || null;
    },

    /**
     * @getter selectedAgentId
     * @description Returns the ID of the currently selected agent.
     */
    selectedAgentId(): string | null {
      return this._currentProfileState?.selectedAgentId || null;
    },
    
    currentContextPaths(): ContextFilePath[] {
      return this.selectedAgent?.contextFilePaths ?? [];
    },
    
    currentRequirement(): string {
      return this.selectedAgent?.requirement ?? '';
    },

    isCurrentlySending(): boolean {
      return this.selectedAgent?.isSending ?? false;
    },

    /**
     * @getter getAgentContextById
     * @description Finds and returns an agent context by its ID across all launch profiles.
     */
    getAgentContextById: (state) => (agentId: string): AgentContext | undefined => {
      for (const profileState of state.agentsByLaunchProfile.values()) {
        if (profileState.activeAgents.has(agentId)) {
          return profileState.activeAgents.get(agentId);
        }
      }
      return undefined;
    },
  },

  actions: {
    /**
     * @action _getOrCreateCurrentProfileState
     * @description (Internal) A robust way to get the state for the current profile, creating it if it doesn't exist.
     */
    _getOrCreateCurrentProfileState(): ProfileAgentState {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) {
        throw new Error("Cannot access agent context state: No agent launch profile is active.");
      }
      if (!this.agentsByLaunchProfile.has(activeProfileId)) {
        this.agentsByLaunchProfile.set(activeProfileId, createDefaultProfileState());
      }
      return this.agentsByLaunchProfile.get(activeProfileId)!;
    },

    /**
     * @action setSelectedAgentId
     * @description Sets the currently selected agent for the active profile.
     */
    setSelectedAgentId(agentId: string | null) {
      const profileState = this._getOrCreateCurrentProfileState();
      profileState.selectedAgentId = agentId;
    },

    /**
     * @action createNewAgentContext
     * @description Creates a new, temporary agent context for the current launch profile.
     */
    createNewAgentContext() {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        throw new Error('Cannot create new agent context: No active launch profile.');
      }
      const profileState = this._getOrCreateCurrentProfileState();
      
      const tempId = `temp-${Date.now()}`;
      const newConversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };
      
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelName: '', // User will select this
        autoExecuteTools: false,
        parseToolCalls: true,
      };

      const agentState = new AgentRunState(tempId, newConversation);
      const newAgentContext = new AgentContext(agentConfig, agentState);

      profileState.activeAgents.set(tempId, newAgentContext);
      profileState.selectedAgentId = tempId;
    },

    createContextForExistingAgent(agentId: string) {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        throw new Error('Cannot create context for existing agent: no active launch profile.');
      }
      const profileState = this._getOrCreateCurrentProfileState();
      const now = new Date().toISOString();

      const newConversation: Conversation = {
        id: agentId,
        messages: [], // Start with empty conversation for now
        createdAt: now,
        updatedAt: now,
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };
      
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelName: '', // This should ideally come from the agent instance info
        autoExecuteTools: false,
        parseToolCalls: true,
      };

      const agentState = new AgentRunState(agentId, newConversation);
      const newAgentContext = new AgentContext(agentConfig, agentState);

      profileState.activeAgents.set(agentId, newAgentContext);
      profileState.selectedAgentId = agentId;
    },
    
    /**
     * @action promoteTemporaryAgentId
     * @description Upgrades a temporary agent context with its permanent ID from the backend.
     */
    promoteTemporaryAgentId(temporaryId: string, permanentId: string) {
        const profileState = this._getOrCreateCurrentProfileState();
        const agentContext = profileState.activeAgents.get(temporaryId);

        if (agentContext) {
            agentContext.state.promoteTemporaryId(permanentId);
            profileState.activeAgents.set(permanentId, agentContext);
            profileState.activeAgents.delete(temporaryId);

            if (profileState.selectedAgentId === temporaryId) {
                profileState.selectedAgentId = permanentId;
            }
        }
    },

    /**
     * @action removeAgentContext
     * @description Removes an agent context from the store.
     */
    removeAgentContext(agentIdToRemove: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.activeAgents.has(agentIdToRemove)) {
        profileState.activeAgents.delete(agentIdToRemove);

        if (profileState.selectedAgentId === agentIdToRemove) {
          const openAgentsArray = Array.from(profileState.activeAgents.values());
          profileState.selectedAgentId = openAgentsArray.length > 0 ? openAgentsArray[openAgentsArray.length - 1].state.agentId : null;
        }
      }
    },

    /**
     * @action addMessageToAgent
     * @description Appends a message to a specific agent's conversation.
     */
    addMessageToAgent(agentId: string, message: Message) {
      const agentContext = this.getAgentContextById(agentId);
      if (agentContext) {
        agentContext.state.conversation.messages.push(message);
        agentContext.state.conversation.updatedAt = new Date().toISOString();
      }
    },

    /**
     * @action updateAgentPhase
     * @description Updates the operational phase of a specific agent.
     */
    updateAgentPhase(agentId: string, newPhase: string) {
      const agentContext = this.getAgentContextById(agentId);
      if (agentContext) {
        agentContext.state.currentPhase = newPhase;
      }
    },
    
    updateSelectedAgentConfig(updates: Partial<AgentRunConfig>) {
        if (this.selectedAgent) {
            Object.assign(this.selectedAgent.config, updates);
        }
    },
    
    updateUserRequirement(newRequirement: string) {
      if (this.selectedAgent) {
        this.selectedAgent.requirement = newRequirement;
      }
    },
    
    addContextFilePath(contextFilePath: ContextFilePath) {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths.push(contextFilePath);
      }
    },

    removeContextFilePath(index: number) {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths.splice(index, 1);
      }
    },

    clearContextFilePaths() {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths = [];
      }
    },

    createContextFromHistory(historicalConversationData: Conversation) {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        throw new Error("Cannot set agent from history: No active launch profile.");
      }
    
      const profileState = this._getOrCreateCurrentProfileState();
      const tempId = `temp-hist-${Date.now()}`;
    
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelName: historicalConversationData.llmModelName || '',
        autoExecuteTools: false,
        parseToolCalls: historicalConversationData.parseToolCalls ?? true,
      };
      
      const newAgentState = new AgentRunState(tempId, {
        ...historicalConversationData,
        id: tempId,
        messages: [],
      });
      const newAgentContext = new AgentContext(agentConfig, newAgentState);
    
      const originalMessages = historicalConversationData.messages;
      for (const msg of originalMessages) {
        if (msg.type === 'user') {
          newAgentContext.conversation.messages.push(msg);
        } else if (msg.type === 'ai') {
          const aiMessage: AIMessage = {
            ...(msg as AIMessage),
            segments: [],
            isComplete: false,
            parserInstance: null as any,
          };
          newAgentContext.conversation.messages.push(aiMessage);
    
          const parserContext = new ParserContext(newAgentContext);
          const parser = new IncrementalAIResponseParser(parserContext);
    
          if (msg.text) {
            parser.processChunks([msg.text]);
          }
          parser.finalize();
    
          aiMessage.parserInstance = parser;
          aiMessage.isComplete = true;
        }
      }
      
      profileState.activeAgents.set(tempId, newAgentContext);
      profileState.selectedAgentId = tempId;
    },
  },
});
