import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentDefinition } from './agentDefinitionStore';
import { useConversationStore } from './conversationStore';
import { useWorkspaceStore } from '~/stores/workspace';

export interface AgentSession {
  sessionId: string;
  workspaceId: string;
  agentDefinition: AgentDefinition; 
  name: string;
  createdAt: string;
  workspaceTypeName: string;
  workspaceConfig: any;
}

interface AgentSessionState {
  sessions: Record<string, AgentSession>;
  activeSessionId: string | null;
}

const SESSION_STORAGE_KEY = 'autobyteus-agent-sessions';

export const useAgentSessionStore = defineStore('agentSession', {
  state: (): AgentSessionState => ({
    sessions: {},
    activeSessionId: null,
  }),

  actions: {
    loadSessions() {
      try {
        const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSessions) {
          this.sessions = JSON.parse(storedSessions);
          if (!this.activeSessionId && Object.keys(this.sessions).length > 0) {
            const latestSession = Object.values(this.sessions).sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            // Do not auto-activate on load, let the user choose.
            // this.setActiveSession(latestSession.sessionId);
          }
        }
      } catch (error) {
        console.error("Failed to load sessions from localStorage", error);
        this.sessions = {};
      }
    },

    saveSessions() {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.sessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage", error);
      }
    },

    createSession(
      agentDefinition: AgentDefinition, 
      workspaceId: string, 
      workspaceName: string, 
      workspaceTypeName: string, 
      workspaceConfig: any
    ): AgentSession {
      // [REFACTORED] Sanitize and clone the config object inside the store to ensure data integrity.
      const sanitizedConfig = JSON.parse(JSON.stringify(workspaceConfig));
      console.log('Creating session with received args:', { workspaceTypeName, sanitizedConfig });

      const sessionId = uuidv4();
      const newSession: AgentSession = {
        sessionId,
        agentDefinition,
        workspaceId,
        name: `${agentDefinition.name} @ ${workspaceName}`,
        createdAt: new Date().toISOString(),
        workspaceTypeName,
        workspaceConfig: sanitizedConfig, // Use the sanitized config
      };

      this.sessions[sessionId] = newSession;
      this.saveSessions();
      console.log(`Created new session with full config:`, newSession);
      return newSession;
    },
    
    deleteSession(sessionId: string) {
        if (this.sessions[sessionId]) {
            delete this.sessions[sessionId];
            if (this.activeSessionId === sessionId) {
                this.activeSessionId = null;
                // Activate the most recent session if one exists
                const remainingSessions = this.sessionList;
                if(remainingSessions.length > 0) {
                    this.setActiveSession(remainingSessions[0].sessionId);
                }
            }
            this.saveSessions();
        }
    },

    async restoreSession(sessionId: string): Promise<boolean> {
      const sessionToRestore = this.sessions[sessionId];
      if (!sessionToRestore) {
        console.error(`Session with ID ${sessionId} not found for restoration.`);
        return false;
      }

      // [DIAGNOSTIC LOGGING] Log the session object we are trying to restore.
      console.log('Attempting to restore session:', JSON.parse(JSON.stringify(sessionToRestore)));

      // Check for legacy or invalid sessions that lack restore information.
      if (!sessionToRestore.workspaceTypeName || !sessionToRestore.workspaceConfig) {
        alert(`Cannot restore session "${sessionToRestore.name}". This session was created with an older version of the application or has invalid data and cannot be automatically restored. Please delete it and create a new one.`);
        return false;
      }

      const workspaceStore = useWorkspaceStore();
      const activeWorkspaces = workspaceStore.workspaces;

      // Helper to compare workspace configs
      const configsAreEqual = (configA: any, configB: any) => {
          try {
              // A simple but effective way to deep compare plain objects
              return JSON.stringify(configA) === JSON.stringify(configB);
          } catch {
              return false;
          }
      };

      // Check if an active session with a matching configuration already exists.
      for (const activeSessionId in this.sessions) {
          const activeSession = this.sessions[activeSessionId];
          // Check if the session is truly active by checking for its workspace in the workspace store
          if (activeWorkspaces[activeSession.workspaceId]) {
              if (
                  activeSession.agentDefinition.id === sessionToRestore.agentDefinition.id &&
                  activeSession.workspaceTypeName === sessionToRestore.workspaceTypeName &&
                  configsAreEqual(activeSession.workspaceConfig, sessionToRestore.workspaceConfig)
              ) {
                  console.log(`Found a matching active session (${activeSession.sessionId}). Activating it instead of creating a new workspace.`);
                  this.setActiveSession(activeSession.sessionId);
                  return true;
              }
          }
      }

      // If no matching active session is found, proceed with creating a new workspace.
      try {
        console.log(`No matching active session found for ${sessionId}. Creating new workspace...`);
        const newWorkspaceId = await workspaceStore.createWorkspace(sessionToRestore.workspaceTypeName, sessionToRestore.workspaceConfig);

        const newWorkspace = workspaceStore.workspaces[newWorkspaceId];

        if (newWorkspace) {
          // Update the session in-memory with the new workspace ID and name
          this.sessions[sessionId].workspaceId = newWorkspace.workspaceId;
          this.sessions[sessionId].name = `${sessionToRestore.agentDefinition.name} @ ${newWorkspace.name}`;
          
          this.saveSessions(); // Persist the updated workspace ID
          this.setActiveSession(sessionId); // Set the restored session as active
          console.log(`Session ${sessionId} restored successfully with new workspace ID ${newWorkspace.workspaceId}.`);
          return true;
        }
        console.error(`Workspace with ID ${newWorkspaceId} not found in store after creation.`);
        return false;
      } catch (error) {
        console.error(`Failed to restore session ${sessionId} due to workspace creation error:`, error);
        return false;
      }
    },

    setActiveSession(sessionId: string | null) {
      if (!sessionId || !this.sessions[sessionId]) {
        this.activeSessionId = null;
        return;
      }
      
      if (this.activeSessionId === sessionId) return;

      this.activeSessionId = sessionId;
      console.log(`Active session changed to: ${sessionId}`);
      
      const conversationStore = useConversationStore();
      conversationStore.ensureConversationForSession(sessionId);
    },
  },
  
  getters: {
    sessionList: (state): AgentSession[] => {
        return Object.values(state.sessions).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeSession: (state): AgentSession | null => {
        if(state.activeSessionId) {
            return state.sessions[state.activeSessionId] || null;
        }
        return null;
    }
  }
});
