import { defineStore } from 'pinia';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { Conversation, ContextFilePath, AIMessage } from '~/types/conversation';
import type { MediaSegment, AIResponseTextSegment } from '~/types/segments';

/**
 * @interface ProfileAgentState
 * @description Manages the state for all agent contexts associated with a single launch profile.
 */
interface ProfileAgentState {
  activeAgents: Map<string, AgentContext>;
  selectedAgentId: string | null;
}

interface AgentContextsStoreState {
  agentsByLaunchProfile: Map<string, ProfileAgentState>;
}

const createDefaultProfileState = (): ProfileAgentState => ({
  activeAgents: new Map(),
  selectedAgentId: null,
});

/**
 * @store agentContexts
 * @description Central repository for agent context state. Pure state management store.
 */
export const useAgentContextsStore = defineStore('agentContexts', {
  state: (): AgentContextsStoreState => ({
    agentsByLaunchProfile: new Map(),
  }),

  getters: {
    _currentProfileState(state): ProfileAgentState | null {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;
      if (selectedProfileType !== 'agent' || !selectedProfileId) return null;
      return state.agentsByLaunchProfile.get(selectedProfileId) || null;
    },

    allOpenAgents(): AgentContext[] {
      return this._currentProfileState ? Array.from(this._currentProfileState.activeAgents.values()) : [];
    },

    selectedAgent(): AgentContext | null {
      if (!this._currentProfileState || !this._currentProfileState.selectedAgentId) return null;
      return this._currentProfileState.activeAgents.get(this._currentProfileState.selectedAgentId) || null;
    },

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
    _getOrCreateCurrentProfileState(): ProfileAgentState {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;

      if (selectedProfileType !== 'agent' || !selectedProfileId) {
        throw new Error("Cannot access agent context state: No agent launch profile is active.");
      }
      
      if (!this.agentsByLaunchProfile.has(selectedProfileId)) {
        this.agentsByLaunchProfile.set(selectedProfileId, createDefaultProfileState());
      }
      return this.agentsByLaunchProfile.get(selectedProfileId)!;
    },

    setSelectedAgentId(agentId: string | null) {
      const profileState = this._getOrCreateCurrentProfileState();
      profileState.selectedAgentId = agentId;
    },

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
        llmModelIdentifier: '',
        autoExecuteTools: false,
        parseToolCalls: true,
      };

      const agentState = new AgentRunState(tempId, newConversation);
      const newAgentContext = new AgentContext(agentConfig, agentState);

      profileState.activeAgents.set(tempId, newAgentContext);
      this.setSelectedAgentId(tempId);
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
        messages: [],
        createdAt: now,
        updatedAt: now,
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };
      
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelIdentifier: '',
        autoExecuteTools: false,
        parseToolCalls: true,
      };

      const agentState = new AgentRunState(agentId, newConversation);
      const newAgentContext = new AgentContext(agentConfig, agentState);

      profileState.activeAgents.set(agentId, newAgentContext);
      this.setSelectedAgentId(agentId);
    },
    
    promoteTemporaryAgentId(temporaryId: string, permanentId: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      const agentContext = profileState.activeAgents.get(temporaryId);

      if (agentContext) {
        agentContext.state.promoteTemporaryId(permanentId);
        
        const newActiveAgents = new Map<string, AgentContext>();
        for (const [key, value] of profileState.activeAgents.entries()) {
          if (key === temporaryId) {
            newActiveAgents.set(permanentId, value);
          } else {
            newActiveAgents.set(key, value);
          }
        }
        profileState.activeAgents = newActiveAgents;

        if (profileState.selectedAgentId === temporaryId) {
          profileState.selectedAgentId = permanentId;
        }
      }
    },

    removeAgentContext(agentIdToRemove: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.activeAgents.has(agentIdToRemove)) {
        profileState.activeAgents.delete(agentIdToRemove);

        if (profileState.selectedAgentId === agentIdToRemove) {
          const openAgentsArray = Array.from(profileState.activeAgents.values());
          profileState.selectedAgentId = openAgentsArray.length > 0 
            ? openAgentsArray[openAgentsArray.length - 1].state.agentId 
            : null;
        }
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


  },
});
