import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentTeamDefinition } from './agentTeamDefinitionStore';
import type { TeamLaunchProfile, TeamMemberConfigOverride } from '~/types/TeamLaunchProfile';
import { useSelectedLaunchProfileStore } from './selectedLaunchProfileStore';
import { useAgentTeamContextsStore } from './agentTeamContextsStore';

interface AgentTeamLaunchProfileState {
  profiles: Record<string, TeamLaunchProfile>;
}

export const AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY = 'autobyteus-agent-team-launch-profiles';

export const useAgentTeamLaunchProfileStore = defineStore('agentTeamLaunchProfile', {
  state: (): AgentTeamLaunchProfileState => ({
    profiles: {},
  }),

  actions: {
    loadLaunchProfiles() {
      try {
        if (typeof window === 'undefined') return;
        const storedProfiles = localStorage.getItem(AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY);
        if (storedProfiles) {
          // TODO: Add validation/migration logic here in the future
          this.profiles = JSON.parse(storedProfiles);
        }
      } catch (error) {
        console.error("Failed to load team launch profiles from localStorage", error);
        this.profiles = {};
      }
    },

    saveLaunchProfiles() {
      try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(AGENT_TEAM_LAUNCH_PROFILE_STORAGE_KEY, JSON.stringify(this.profiles));
      } catch (error) {
        console.error("Failed to save team launch profiles to localStorage", error);
      }
    },

    createLaunchProfile(
      teamDefinition: AgentTeamDefinition,
      launchConfig: {
        name: string;
        globalConfig: TeamLaunchProfile['globalConfig'];
        memberOverrides: TeamMemberConfigOverride[];
      }
    ): TeamLaunchProfile {
      const profileId = uuidv4();
      const newProfile: TeamLaunchProfile = {
        id: profileId,
        name: launchConfig.name || teamDefinition.name,
        createdAt: new Date().toISOString(),
        teamDefinition: JSON.parse(JSON.stringify(teamDefinition)), // Storing a deep copy snapshot
        globalConfig: JSON.parse(JSON.stringify(launchConfig.globalConfig)),
        memberOverrides: JSON.parse(JSON.stringify(launchConfig.memberOverrides)),
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

      // If the deleted profile was the active one, clear the selection.
      if (selectedLaunchProfileStore.selectedProfileId === profileId && selectedLaunchProfileStore.selectedProfileType === 'team') {
        selectedLaunchProfileStore.clearSelection();
      }
    },

    setActiveLaunchProfile(profileId: string) {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      
      if (selectedLaunchProfileStore.selectedProfileId === profileId && selectedLaunchProfileStore.selectedProfileType === 'team') {
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
    
    _runningProfileIds(): Set<string> {
      const teamContextsStore = useAgentTeamContextsStore();
      const runningInstanceProfileIds = teamContextsStore.allRunningTeamInstancesAcrossProfiles.map(instance => instance.launchProfile.id);
      return new Set(runningInstanceProfileIds);
    },

    activeLaunchProfiles(): TeamLaunchProfile[] {
      const runningIds = this._runningProfileIds;
      return this.allLaunchProfiles.filter(p => runningIds.has(p.id));
    },
    
    inactiveLaunchProfiles(): TeamLaunchProfile[] {
      const runningIds = this._runningProfileIds;
      return this.allLaunchProfiles.filter(p => !runningIds.has(p.id));
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
