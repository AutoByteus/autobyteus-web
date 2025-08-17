import { defineStore } from 'pinia';
import { useSelectedLaunchProfileStore } from './selectedLaunchProfileStore';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { TeamMemberConfigInput } from '~/generated/graphql';

/**
 * @interface ResolvedTeamLaunchProfile
 * @description Represents the live, resolved state for an active team profile.
 * It holds the actual workspace IDs and other settings that all instances will share.
 * This is an ephemeral state that exists only while a profile is active.
 */
export interface ResolvedTeamLaunchProfile {
  profileId: string;
  resolvedMemberConfigs: TeamMemberConfigInput[];
}

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
  teamsByLaunchProfile: Map<string, ProfileTeamState>;
  activeResolvedProfile: ResolvedTeamLaunchProfile | null;
}

// Helper to create initial state for a new profile.
const createDefaultProfileState = (): ProfileTeamState => ({
  activeTeams: new Map(),
  selectedTeamId: null,
});


export const useAgentTeamContextsStore = defineStore('agentTeamContexts', {
  state: (): AgentTeamContextsState => ({
    teamsByLaunchProfile: new Map(),
    activeResolvedProfile: null,
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
     * @getter allRunningTeamInstancesAcrossProfiles
     * @description Returns an array of all active team instances across ALL launch profiles.
     */
    allRunningTeamInstancesAcrossProfiles(state): AgentTeamContext[] {
      const allInstances: AgentTeamContext[] = [];
      for (const profileState of state.teamsByLaunchProfile.values()) {
        for (const teamInstance of profileState.activeTeams.values()) {
          allInstances.push(teamInstance);
        }
      }
      return allInstances;
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
    },

    getTeamContextById: (state) => (teamId: string): AgentTeamContext | null => {
      for (const profileState of state.teamsByLaunchProfile.values()) {
        if (profileState.activeTeams.has(teamId)) {
          return profileState.activeTeams.get(teamId)!;
        }
      }
      return null;
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

    setActiveResolvedProfile(profile: ResolvedTeamLaunchProfile | null) {
      this.activeResolvedProfile = profile;
    },
    
    promoteTemporaryTeamId(temporaryId: string, permanentId: string) {
        const teamContext = this.getTeamContextById(temporaryId);
        if (!teamContext) {
            console.error(`Cannot promote ID: Temporary team context ${temporaryId} not found.`);
            return;
        }

        const profileState = this._getOrCreateCurrentProfileState();
        if (!profileState || !profileState.activeTeams.has(temporaryId)) {
            console.error(`Inconsistency: Team context ${temporaryId} found, but not in its profile's active map.`);
            return;
        }

        teamContext.teamId = permanentId;
        teamContext.members.forEach(member => {
          member.state.conversation.id = `${permanentId}::${member.state.agentId}`;
        });
        
        const newActiveTeams = new Map<string, AgentTeamContext>();
        for (const [key, value] of profileState.activeTeams.entries()) {
            if (key === temporaryId) {
                newActiveTeams.set(permanentId, value);
            } else {
                newActiveTeams.set(key, value);
            }
        }
        profileState.activeTeams = newActiveTeams;
        
        if (profileState.selectedTeamId === temporaryId) {
            profileState.selectedTeamId = permanentId;
        }
    },
    
    addTeamContext(context: AgentTeamContext) {
      const profileState = this._getOrCreateCurrentProfileState();
      profileState.activeTeams.set(context.teamId, context);
      profileState.selectedTeamId = context.teamId;
    },

    removeTeamContext(teamIdToRemove: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      const teamToRemove = profileState.activeTeams.get(teamIdToRemove);
      
      if (teamToRemove) {
        teamToRemove.unsubscribe?.();
        profileState.activeTeams.delete(teamIdToRemove);

        if (profileState.selectedTeamId === teamIdToRemove) {
          const openTeams = Array.from(profileState.activeTeams.values());
          profileState.selectedTeamId = openTeams.length > 0 ? openTeams[openTeams.length - 1].teamId : null;
        }

        // The problematic block that cleared the session has been removed.
        // The activeResolvedProfile will now persist until the user navigates away.
      }
    },

    setSelectedTeamId(teamId: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      if (profileState.activeTeams.has(teamId)) {
        profileState.selectedTeamId = teamId;
      }
    },
    
    setFocusedMember(memberName: string) {
      if (this.activeTeamContext && this.activeTeamContext.members.has(memberName)) {
        this.activeTeamContext.focusedMemberName = memberName;
      }
    },
  },
});
