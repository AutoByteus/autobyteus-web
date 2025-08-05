import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentDefinition } from './agentDefinitionStore';
import { useAgentRunStore } from './agentRunStore';
import { useSelectedLaunchProfileStore } from './selectedLaunchProfileStore';
import type { AgentLaunchProfile } from '~/types/AgentLaunchProfile';

interface AgentLaunchProfileState {
  activeLaunchProfiles: Record<string, AgentLaunchProfile>;
  inactiveLaunchProfiles: Record<string, AgentLaunchProfile>;
  // activeProfileId is now managed by useSelectedLaunchProfileStore
}

export const LAUNCH_PROFILE_STORAGE_KEY = 'autobyteus-agent-launch-profiles';

export const useAgentLaunchProfileStore = defineStore('agentLaunchProfile', {
  state: (): AgentLaunchProfileState => ({
    activeLaunchProfiles: {},
    inactiveLaunchProfiles: {},
  }),

  actions: {
    partitionLaunchProfiles(allProfiles: Record<string, AgentLaunchProfile>, activeWorkspaceIds: string[]) {
      this.activeLaunchProfiles = {};
      this.inactiveLaunchProfiles = {};

      for (const profileId in allProfiles) {
        const profile = allProfiles[profileId];
        const isWorkspaceActive = profile.workspaceId && activeWorkspaceIds.includes(profile.workspaceId);
        const isWorkspaceLess = profile.workspaceId === null;

        if (isWorkspaceActive || isWorkspaceLess) {
          this.activeLaunchProfiles[profileId] = profile;
        } else {
          this.inactiveLaunchProfiles[profileId] = profile;
        }
      }
    },

    saveLaunchProfiles() {
      try {
        const allProfiles = { ...this.activeLaunchProfiles, ...this.inactiveLaunchProfiles };
        localStorage.setItem(LAUNCH_PROFILE_STORAGE_KEY, JSON.stringify(allProfiles));
      } catch (error) {
        console.error("Failed to save launch profiles to localStorage", error);
      }
    },

    createLaunchProfile(
      agentDefinition: AgentDefinition, 
      workspaceId: string | null, 
      workspaceName: string, 
      workspaceTypeName: string, 
      workspaceConfig: any
    ): AgentLaunchProfile {
      const sanitizedConfig = JSON.parse(JSON.stringify(workspaceConfig));
      const profileId = uuidv4();
      const newProfile: AgentLaunchProfile = {
        id: profileId,
        agentDefinition,
        workspaceId,
        name: workspaceId ? `${agentDefinition.name} @ ${workspaceName}` : `${agentDefinition.name} @ No Workspace`,
        createdAt: new Date().toISOString(),
        workspaceTypeName,
        workspaceConfig: sanitizedConfig,
      };

      this.activeLaunchProfiles[profileId] = newProfile;
      this.saveLaunchProfiles();
      return newProfile;
    },
    
    deleteLaunchProfile(profileId: string) {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      
      if (this.activeLaunchProfiles[profileId]) {
        delete this.activeLaunchProfiles[profileId];
      } else if (this.inactiveLaunchProfiles[profileId]) {
        delete this.inactiveLaunchProfiles[profileId];
      }

      if (selectedLaunchProfileStore.selectedProfileId === profileId) {
        selectedLaunchProfileStore.clearSelection();
        const remainingProfiles = this.activeLaunchProfileList;
        if (remainingProfiles.length > 0) {
          this.setActiveLaunchProfile(remainingProfiles[0].id);
        }
      }
      this.saveLaunchProfiles();
    },

    async activateByCreatingWorkspace(profileId: string): Promise<boolean> {
      const { useWorkspaceStore } = await import('~/stores/workspace');
      const workspaceStore = useWorkspaceStore();

      const profileToRestore = this.inactiveLaunchProfiles[profileId];
      if (!profileToRestore) {
        console.error(`Launch profile with ID ${profileId} not found for restoration.`);
        return false;
      }
      
      if (!profileToRestore.workspaceTypeName || !profileToRestore.workspaceConfig) {
        alert(`Cannot restore profile "${profileToRestore.name}". This profile has invalid data.`);
        return false;
      }
      
      try {
        const newWorkspaceId = await workspaceStore.createWorkspace(profileToRestore.workspaceTypeName, profileToRestore.workspaceConfig);
        const newWorkspace = workspaceStore.workspaces[newWorkspaceId];

        if (newWorkspace) {
          profileToRestore.workspaceId = newWorkspace.workspaceId;
          profileToRestore.name = `${profileToRestore.agentDefinition.name} @ ${newWorkspace.name}`;
          
          this.activeLaunchProfiles[profileId] = profileToRestore;
          delete this.inactiveLaunchProfiles[profileId];
          
          this.saveLaunchProfiles();
          this.setActiveLaunchProfile(profileId);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Failed to activate profile ${profileId} by creating workspace:`, error);
        return false;
      }
    },

    async activateByAttachingToWorkspace(profileId: string, targetWorkspaceId: string): Promise<boolean> {
      const { useWorkspaceStore } = await import('~/stores/workspace');
      const workspaceStore = useWorkspaceStore();
      
      const profileToAttach = this.inactiveLaunchProfiles[profileId];
      if (!profileToAttach) {
        console.error(`Launch profile with ID ${profileId} not found for attachment.`);
        return false;
      }

      const targetWorkspace = workspaceStore.workspaces[targetWorkspaceId];
      if (!targetWorkspace) {
        console.error(`Target workspace with ID ${targetWorkspaceId} not found.`);
        return false;
      }

      profileToAttach.workspaceId = targetWorkspace.workspaceId;
      profileToAttach.name = `${profileToAttach.agentDefinition.name} @ ${targetWorkspace.name}`;
      profileToAttach.workspaceTypeName = targetWorkspace.workspaceTypeName;
      profileToAttach.workspaceConfig = targetWorkspace.workspaceConfig;

      this.activeLaunchProfiles[profileId] = profileToAttach;
      delete this.inactiveLaunchProfiles[profileId];
      
      this.saveLaunchProfiles();
      this.setActiveLaunchProfile(profileId);
      return true;
    },

    async activateInactiveProfile(profileId: string, options: { choice: 'recreate' | 'attach', workspaceId?: string }): Promise<boolean> {
      if (options.choice === 'recreate') {
        return await this.activateByCreatingWorkspace(profileId);
      } else if (options.choice === 'attach' && options.workspaceId) {
        return await this.activateByAttachingToWorkspace(profileId, options.workspaceId);
      } else {
        console.error("Invalid options provided to activateInactiveProfile", options);
        return false;
      }
    },

    setActiveLaunchProfile(profileId: string | null, attachToAgentId?: string) {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      
      if (!profileId || !this.activeLaunchProfiles[profileId]) {
        selectedLaunchProfileStore.clearSelection();
        return;
      }
      
      if (selectedLaunchProfileStore.selectedProfileId === profileId && !attachToAgentId) return;

      // This is the main change: update the central store instead of a local state property.
      selectedLaunchProfileStore.selectProfile(profileId, 'agent');
      
      // The rest of the logic remains here for coherence, as requested.
      const agentRunStore = useAgentRunStore();
      agentRunStore.ensureAgentForLaunchProfile(profileId, attachToAgentId);
    },
  },
  
  getters: {
    inactiveLaunchProfileList(state): AgentLaunchProfile[] {
        return Object.values(state.inactiveLaunchProfiles).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeLaunchProfileList(state): AgentLaunchProfile[] {
        return Object.values(state.activeLaunchProfiles).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeLaunchProfile(): AgentLaunchProfile | null {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;

      if (selectedProfileType === 'agent' && selectedProfileId && this.activeLaunchProfiles[selectedProfileId]) {
        return this.activeLaunchProfiles[selectedProfileId];
      }
      return null;
    }
  }
});
