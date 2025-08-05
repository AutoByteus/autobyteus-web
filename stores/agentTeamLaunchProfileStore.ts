import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentTeamDefinition } from './agentTeamDefinitionStore';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';
import type { TeamMemberConfigInput } from '~/generated/graphql';
import { useSelectedLaunchProfileStore } from './selectedLaunchProfileStore';

interface TeamLaunchProfileState {
  profiles: Record<string, TeamLaunchProfile>;
}

export const AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY = 'autobyteus-agent-team-launch-profiles';

export const useAgentTeamLaunchProfileStore = defineStore('agentTeamLaunchProfile', {
  state: (): TeamLaunchProfileState => ({
    profiles: {},
  }),

  actions: {
    loadLaunchProfiles() {
      try {
        const storedProfiles = localStorage.getItem(AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY);
        if (storedProfiles) {
          this.profiles = JSON.parse(storedProfiles);
        }
      } catch (error) {
        console.error("Failed to load team launch profiles from localStorage", error);
        this.profiles = {};
      }
    },

    saveLaunchProfiles() {
      try {
        localStorage.setItem(AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY, JSON.stringify(this.profiles));
      } catch (error) {
        console.error("Failed to save team launch profiles to localStorage", error);
      }
    },

    createLaunchProfile(
      teamDefinition: AgentTeamDefinition,
      config: {
        globalLlmModelName: string;
        globalWorkspaceId: string | null;
        memberConfigs: TeamMemberConfigInput[];
      }
    ): TeamLaunchProfile {
      const profileId = uuidv4();
      const newProfile: TeamLaunchProfile = {
        id: profileId,
        teamDefinition,
        name: teamDefinition.name,
        createdAt: new Date().toISOString(),
        teamConfig: config,
      };

      this.profiles[profileId] = newProfile;
      this.saveLaunchProfiles();
      return newProfile;
    },
    
    deleteLaunchProfile(profileId: string) {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      if (this.profiles[profileId]) {
        delete this.profiles[profileId];
        this.saveLaunchProfiles();
      }

      if (selectedLaunchProfileStore.selectedProfileId === profileId) {
        selectedLaunchProfileStore.clearSelection();
      }
    },

    setActiveLaunchProfile(profileId: string) {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      
      if (selectedLaunchProfileStore.selectedProfileId === profileId) {
        return; // Avoid unnecessary re-selection
      }

      if (!this.profiles[profileId]) {
        console.error(`Attempted to activate non-existent team launch profile: ${profileId}`);
        return;
      }
      
      selectedLaunchProfileStore.selectProfile(profileId, 'team');
    },
  },
  
  getters: {
    allLaunchProfiles(state): TeamLaunchProfile[] {
      return Object.values(state.profiles).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    
    activeLaunchProfile(): TeamLaunchProfile | null {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;

      if (selectedProfileType === 'team' && selectedProfileId && this.profiles[selectedProfileId]) {
        return this.profiles[selectedProfileId];
      }
      return null;
    }
  }
});
