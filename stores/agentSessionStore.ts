import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { AgentDefinition } from './agentDefinitionStore';
import { useConversationStore } from './conversationStore';

export interface AgentSession {
  sessionId: string;
  workspaceId: string | null;
  agentDefinition: AgentDefinition; 
  name: string;
  createdAt: string;
  workspaceTypeName: string;
  workspaceConfig: any;
}

interface AgentSessionState {
  activeSessions: Record<string, AgentSession>;
  inactiveSessions: Record<string, AgentSession>;
  activeSessionId: string | null;
}

export const SESSION_STORAGE_KEY = 'autobyteus-agent-sessions';

export const useAgentSessionStore = defineStore('agentSession', {
  state: (): AgentSessionState => ({
    activeSessions: {},
    inactiveSessions: {},
    activeSessionId: null,
  }),

  actions: {
    partitionSessions(allSessions: Record<string, AgentSession>, activeWorkspaceIds: string[]) {
      this.activeSessions = {};
      this.inactiveSessions = {};

      for (const sessionId in allSessions) {
        const session = allSessions[sessionId];
        const isWorkspaceActive = session.workspaceId && activeWorkspaceIds.includes(session.workspaceId);
        const isWorkspaceLess = session.workspaceId === null;

        if (isWorkspaceActive || isWorkspaceLess) {
          this.activeSessions[sessionId] = session;
        } else {
          this.inactiveSessions[sessionId] = session;
        }
      }
    },

    saveSessions() {
      try {
        const allSessions = { ...this.activeSessions, ...this.inactiveSessions };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allSessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage", error);
      }
    },

    createSession(
      agentDefinition: AgentDefinition, 
      workspaceId: string | null, 
      workspaceName: string, 
      workspaceTypeName: string, 
      workspaceConfig: any
    ): AgentSession {
      const sanitizedConfig = JSON.parse(JSON.stringify(workspaceConfig));
      const sessionId = uuidv4();
      const newSession: AgentSession = {
        sessionId,
        agentDefinition,
        workspaceId,
        name: workspaceId ? `${agentDefinition.name} @ ${workspaceName}` : `${agentDefinition.name} @ No Workspace`,
        createdAt: new Date().toISOString(),
        workspaceTypeName,
        workspaceConfig: sanitizedConfig,
      };

      this.activeSessions[sessionId] = newSession;
      this.saveSessions();
      return newSession;
    },
    
    deleteSession(sessionId: string) {
      let wasActive = false;
      if (this.activeSessions[sessionId]) {
        delete this.activeSessions[sessionId];
        wasActive = true;
      } else if (this.inactiveSessions[sessionId]) {
        delete this.inactiveSessions[sessionId];
      }

      if (wasActive && this.activeSessionId === sessionId) {
        this.activeSessionId = null;
        const remainingSessions = this.activeSessionList;
        if (remainingSessions.length > 0) {
          this.setActiveSession(remainingSessions[0].sessionId);
        }
      }
      this.saveSessions();
    },

    async restoreSession(sessionId: string): Promise<boolean> {
      // This action now requires workspaceStore to be passed or imported inside the function
      // to avoid circular dependency at the module level.
      const { useWorkspaceStore } = await import('~/stores/workspace');
      const workspaceStore = useWorkspaceStore();

      const sessionToRestore = this.inactiveSessions[sessionId];
      if (!sessionToRestore) {
        console.error(`Session with ID ${sessionId} not found in inactive sessions for restoration.`);
        return false;
      }
      
      console.log('Attempting to restore session from inactive:', JSON.parse(JSON.stringify(sessionToRestore)));

      if (!sessionToRestore.workspaceTypeName || !sessionToRestore.workspaceConfig) {
        alert(`Cannot restore session "${sessionToRestore.name}". This session has invalid data. Please delete it and create a new one.`);
        return false;
      }
      
      try {
        const newWorkspaceId = await workspaceStore.createWorkspace(sessionToRestore.workspaceTypeName, sessionToRestore.workspaceConfig);
        const newWorkspace = workspaceStore.workspaces[newWorkspaceId];

        if (newWorkspace) {
          // Update session details
          sessionToRestore.workspaceId = newWorkspace.workspaceId;
          sessionToRestore.name = `${sessionToRestore.agentDefinition.name} @ ${newWorkspace.name}`;
          
          // Move from inactive to active
          this.activeSessions[sessionId] = sessionToRestore;
          delete this.inactiveSessions[sessionId];
          
          this.saveSessions();
          this.setActiveSession(sessionId);
          console.log(`Session ${sessionId} restored and moved to active sessions.`);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Failed to restore session ${sessionId} due to workspace creation error:`, error);
        return false;
      }
    },

    setActiveSession(sessionId: string | null) {
      if (!sessionId || !this.activeSessions[sessionId]) {
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
    inactiveSessionList(state): AgentSession[] {
        return Object.values(state.inactiveSessions).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeSessionList(state): AgentSession[] {
        return Object.values(state.activeSessions).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    activeSession(state): AgentSession | null {
        if(state.activeSessionId) {
            return state.activeSessions[state.activeSessionId] || null;
        }
        return null;
    }
  }
});
