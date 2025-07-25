import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentDefinition } from './agentDefinitionStore';
import { useConversationStore } from './conversationStore';

export interface AgentLaunchProfile {
  id: string; // Renamed from sessionId
  workspaceId: string | null;
  agentDefinition: AgentDefinition; 
  name: string;
  createdAt: string;
  workspaceTypeName: string;
  workspaceConfig: any;
}

interface AgentLaunchProfileState {
  activeLaunchProfiles: Record<string, AgentLaunchProfile>;
  inactiveLaunchProfiles: Record<string, AgentLaunchProfile>;
  activeProfileId: string | null; // Renamed from activeSessionId
}

export const LAUNCH_PROFILE_STORAGE_KEY = 'autobyteus-agent-launch-profiles'; // Renamed from SESSION_STORAGE_KEY

export const useAgentLaunchProfileStore = defineStore('agentLaunchProfile', { // Renamed from agentSession
  state: (): AgentLaunchProfileState => ({
    activeLaunchProfiles: {},
    inactiveLaunchProfiles: {},
    activeProfileId: null,
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
        id: profileId, // Renamed from sessionId
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
      let wasActive = false;
      if (this.activeLaunchProfiles[profileId]) {
        delete this.activeLaunchProfiles[profileId];
        wasActive = true;
      } else if (this.inactiveLaunchProfiles[profileId]) {
        delete this.inactiveLaunchProfiles[profileId];
      }

      if (wasActive && this.activeProfileId === profileId) {
        this.activeProfileId = null;
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

    setActiveLaunchProfile(profileId: string | null) {
      if (!profileId || !this.activeLaunchProfiles[profileId]) {
        this.activeProfileId = null;
        return;
      }
      
      if (this.activeProfileId === profileId) return;

      this.activeProfileId = profileId;
      console.log(`Active launch profile changed to: ${profileId}`);
      
      const conversationStore = useConversationStore();
      conversationStore.ensureConversationForLaunchProfile(profileId);
    },
  },
  
  getters: {
    inactiveLaunchProfileList(state): AgentLaunchProfile[] {
        return Object.values(state.inactiveLaunchProfiles).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeLaunchProfileList(state): AgentLaunchProfile[] {
        return Object.values(state.activeLaunchProfiles).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeLaunchProfile(state): AgentLaunchProfile | null {
        if(state.activeProfileId) {
            return state.activeLaunchProfiles[state.activeProfileId] || null;
        }
        return null;
    }
  }
});
