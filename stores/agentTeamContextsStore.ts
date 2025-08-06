import { defineStore } from 'pinia';
import { useSelectedLaunchProfileStore } from './selectedLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from './agentTeamLaunchProfileStore';
import { useAgentTeamRunStore } from './agentTeamRunStore';

import { AgentRunState } from '~/types/agent/AgentRunState';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { Conversation } from '~/types/conversation';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

/**
 * @interface ProfileTeamState
 * @description Manages all team instances for a single TeamLaunchProfile.
 */
interface ProfileTeamState {
  activeTeams: Map<string, AgentTeamContext>; // teamId -> AgentTeamContext
  selectedTeamId: string | null;
}

/**
 * @interface AgentTeamContextsState
 * @description The root state, organizing team states by their parent launch profile ID.
 */
interface AgentTeamContextsState {
  teamsByLaunchProfile: Map<string, ProfileTeamState>; // launchProfileId -> ProfileTeamState
}

// Helper to create initial state for a new profile.
const createDefaultProfileState = (): ProfileTeamState => ({
  activeTeams: new Map(),
  selectedTeamId: null,
});


export const useAgentTeamContextsStore = defineStore('agentTeamContexts', {
  state: (): AgentTeamContextsState => ({
    teamsByLaunchProfile: new Map(),
  }),

  getters: {
    /**
     * @getter _currentProfileState
     * @description (Internal) Safely retrieves the state object for the currently active team launch profile.
     */
    _currentProfileState(state): ProfileTeamState | null {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;
      
      if (selectedProfileType !== 'team' || !selectedProfileId) {
        return null;
      }
      return state.teamsByLaunchProfile.get(selectedProfileId) || null;
    },

    /**
     * @getter activeTeamContext
     * @description Returns the currently selected team context (active tab) for the current launch profile.
     */
    activeTeamContext(): AgentTeamContext | null {
      const profileState = this._currentProfileState;
      if (!profileState || !profileState.selectedTeamId) {
        return null;
      }
      return profileState.activeTeams.get(profileState.selectedTeamId) || null;
    },
    
    /**
     * @getter allTeamInstances
     * @description Returns an array of all active team instances for the current launch profile.
     */
    allTeamInstances(): AgentTeamContext[] {
        return this._currentProfileState ? Array.from(this._currentProfileState.activeTeams.values()) : [];
    },

    /**
     * @getter selectedTeamId
     * @description Returns the ID of the currently selected team instance.
     */
    selectedTeamId(): string | null {
      return this._currentProfileState?.selectedTeamId || null;
    },
    
    /**
     * @getter focusedMemberContext
     * @description Returns the focused member of the active team instance.
     */
    focusedMemberContext(): AgentContext | null {
      if (!this.activeTeamContext || !this.activeTeamContext.focusedMemberName) {
        return null;
      }
      return this.activeTeamContext.members.get(this.activeTeamContext.focusedMemberName) || null;
    },
    
    /**
     * @getter teamMembers
     * @description Returns all members of the active team instance.
     */
    teamMembers(): AgentContext[] {
      if (!this.activeTeamContext) return [];
      return Array.from(this.activeTeamContext.members.values());
    }
  },

  actions: {
    /**
     * @action _getOrCreateCurrentProfileState
     * @description (Internal) Gets the state for the current profile, creating it if it doesn't exist.
     */
    _getOrCreateCurrentProfileState(): ProfileTeamState {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;

      if (selectedProfileType !== 'team' || !selectedProfileId) {
        throw new Error("Cannot access team context state: No team launch profile is active.");
      }
      
      if (!this.teamsByLaunchProfile.has(selectedProfileId)) {
        this.teamsByLaunchProfile.set(selectedProfileId, createDefaultProfileState());
      }
      return this.teamsByLaunchProfile.get(selectedProfileId)!;
    },

    /**
     * @action createNewTeamContext
     * @description Orchestrates the creation of a new team instance.
     */
    async createNewTeamContext() {
      const teamRunStore = useAgentTeamRunStore();
      const teamLaunchProfileStore = useAgentTeamLaunchProfileStore();

      const activeLaunchProfile = teamLaunchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        throw new Error("Cannot create new team context: No active team launch profile.");
      }
      
      // The run store will handle backend communication and then call back to add the context.
      await teamRunStore.launchNewInstanceFromProfile(activeLaunchProfile);
    },

    /**
     * @action addTeamContext
     * @description Adds a fully-formed team context to the current profile's state.
     */
    addTeamContext(context: AgentTeamContext) {
      const profileState = this._getOrCreateCurrentProfileState();
      profileState.activeTeams.set(context.teamId, context);
      // Automatically select the new team instance
      profileState.selectedTeamId = context.teamId;
    },

    /**
     * @action removeTeamContext
     * @description Removes a team instance from the store.
     */
    removeTeamContext(teamIdToRemove: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      const teamToRemove = profileState.activeTeams.get(teamIdToRemove);
      
      if (teamToRemove) {
        // Unsubscribe from backend events
        teamToRemove.unsubscribe?.();
        profileState.activeTeams.delete(teamIdToRemove);

        // If the removed team was selected, select another one
        if (profileState.selectedTeamId === teamIdToRemove) {
          const openTeams = Array.from(profileState.activeTeams.values());
          profileState.selectedTeamId = openTeams.length > 0 ? openTeams[openTeams.length - 1].teamId : null;
        }
      }
    },

    /**
     * @action setSelectedTeamId
     * @description Sets the currently selected team instance for the active profile.
     */
    setSelectedTeamId(teamId: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.activeTeams.has(teamId)) {
        profileState.selectedTeamId = teamId;
      }
    },
    
    /**
     * @action setFocusedMember
     * @description Sets the focused member within the active team instance.
     */
    setFocusedMember(memberName: string) {
      if (this.activeTeamContext && this.activeTeamContext.members.has(memberName)) {
        this.activeTeamContext.focusedMemberName = memberName;
      }
    },
  },
});
