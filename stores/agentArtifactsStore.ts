import { defineStore } from 'pinia';
import { useAgentContextsStore } from '~/stores/agentContextsStore';

export type ArtifactStatus = 'streaming' | 'pending_approval' | 'persisted' | 'failed';

export interface AgentArtifact {
  id: string; // Unique ID (UUID or Path for streaming)
  agentId: string;
  path: string; // Relative path (e.g., "src/hello.py")
  type: 'file' | 'image' | 'audio' | 'video' | 'pdf' | 'csv' | 'excel' | 'other';
  status: ArtifactStatus;
  content?: string; // Content buffer for text files
  url?: string; // URL for media files
  workspaceRoot?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentArtifactsState {
  // Map of AgentID -> Artifact[]
  artifactsByAgent: Map<string, AgentArtifact[]>;
  // Map of AgentID -> Pending Artifact (Only one active at a time usually)
  activeStreamingArtifactByAgent: Map<string, AgentArtifact | null>;
}

export const useAgentArtifactsStore = defineStore('agentArtifacts', {
  state: (): AgentArtifactsState => ({
    artifactsByAgent: new Map(),
    activeStreamingArtifactByAgent: new Map(),
  }),

  getters: {
    getArtifactsForAgent: (state) => (agentId: string) => {
      return state.artifactsByAgent.get(agentId) || [];
    },
    getActiveStreamingArtifact: (state) => (agentId: string) => {
      return state.activeStreamingArtifactByAgent.get(agentId) || null;
    },
  },

  actions: {
    /**
     * Start streaming a new artifact (e.g. write_file start)
     * If an artifact with the same path already exists for this agent,
     * it will be updated (reset to streaming) instead of creating a duplicate.
     */
    createPendingArtifact(agentId: string, path: string, type: 'file' | 'image' = 'file') {
      // Check if an artifact with the same path already exists
      const existingArtifacts = this.artifactsByAgent.get(agentId) || [];
      const existingArtifact = existingArtifacts.find(a => a.path === path);

      if (existingArtifact) {
        // Update existing artifact - reset for new streaming session
        existingArtifact.status = 'streaming';
        existingArtifact.content = '';
        const now = new Date().toISOString();
        existingArtifact.createdAt = now;
        existingArtifact.updatedAt = now;
        this.activeStreamingArtifactByAgent.set(agentId, existingArtifact);
        return;
      }

      // Create new artifact
      const artifact: AgentArtifact = {
        id: `pending-${Date.now()}`, // Temp ID
        agentId,
        path,
        type,
        status: 'streaming',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Set as active streaming
      this.activeStreamingArtifactByAgent.set(agentId, artifact);
      
      // Add to list immediately so it shows up
      if (!this.artifactsByAgent.has(agentId)) {
        this.artifactsByAgent.set(agentId, []);
      }
      this.artifactsByAgent.get(agentId)?.push(artifact);
      
      // OPTIONAL: Trigger side-effect to switch tabs (handled by component or handler)
    },

    /**
     * Append content to the current streaming artifact
     */
    appendArtifactContent(agentId: string, delta: string) {
      const artifact = this.activeStreamingArtifactByAgent.get(agentId);
      if (artifact && artifact.status === 'streaming') {
        artifact.content = (artifact.content || '') + delta;
      }
    },

    /**
     * Mark the artifact as fully streamed and waiting for approval
     */
    finalizeArtifactStream(agentId: string) {
      const artifact = this.activeStreamingArtifactByAgent.get(agentId);
      if (artifact) {
        artifact.status = 'pending_approval';
        artifact.updatedAt = new Date().toISOString();
        // Clear active streamer so we don't accidentally append to it later
        this.activeStreamingArtifactByAgent.set(agentId, null);
      }
    },

    /**
     * Mark artifact as persisted (Tool was approved and executed)
     * This might be called by a separate event or optimistic update
     */
    markArtifactPersisted(agentId: string, path: string, workspaceRoot?: string | null) {
        const artifacts = this.artifactsByAgent.get(agentId) || [];
        // Find the pending one matching path
        const artifact = artifacts.find(a => a.path === path && a.status === 'pending_approval');
        if (artifact) {
            artifact.status = 'persisted';
            artifact.updatedAt = new Date().toISOString();
            if (workspaceRoot !== undefined) {
              artifact.workspaceRoot = workspaceRoot;
            }
        }
    },

    /**
     * Create a media artifact directly (for image/audio files that don't stream).
     * These are created as 'persisted' immediately since the file already exists.
     */
    createMediaArtifact(artifact: Omit<AgentArtifact, 'status' | 'createdAt' | 'updatedAt'> & { timestamp?: string }) {
      const timestamp = artifact.timestamp || new Date().toISOString();
      const newArtifact: AgentArtifact = {
        ...artifact,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'persisted',
      };

      if (!this.artifactsByAgent.has(artifact.agentId)) {
        this.artifactsByAgent.set(artifact.agentId, []);
      }
      this.artifactsByAgent.get(artifact.agentId)?.push(newArtifact);
    },
    
    /**
     * Mark artifact as failed/cancelled
     */
    markArtifactFailed(agentId: string, path: string) {
        const artifacts = this.artifactsByAgent.get(agentId) || [];
        const artifact = artifacts.find(a => a.path === path && a.status === 'pending_approval');
        if (artifact) {
            artifact.status = 'failed';
            artifact.updatedAt = new Date().toISOString();
        }
    },

    /**
     * Touch an existing artifact to trigger refreshes (e.g., patch_file updates).
     * Creates a persisted artifact if none exists yet.
     */
    touchArtifact(
      agentId: string,
      path: string,
      type: AgentArtifact['type'] = 'file',
      artifactId?: string,
      workspaceRoot?: string | null
    ) {
      const artifacts = this.artifactsByAgent.get(agentId) || [];
      const artifact = artifacts.find(a => a.path === path || (artifactId && a.id === artifactId));
      const now = new Date().toISOString();

      if (artifact) {
        artifact.updatedAt = now;
        if (workspaceRoot !== undefined) {
          artifact.workspaceRoot = workspaceRoot;
        }
        return;
      }

      const newArtifact: AgentArtifact = {
        id: artifactId || `artifact-${Date.now()}`,
        agentId,
        path,
        type,
        status: 'persisted',
        workspaceRoot: workspaceRoot ?? null,
        createdAt: now,
        updatedAt: now,
      };

      if (!this.artifactsByAgent.has(agentId)) {
        this.artifactsByAgent.set(agentId, []);
      }
      this.artifactsByAgent.get(agentId)?.push(newArtifact);
    },

    /**
     * Fetch persisted artifacts from the backend for an agent.
     * Use this when loading a previous session or restoring state after page refresh.
     * Not actively used yet - ready for future session restoration feature.
     */
    async fetchArtifactsForAgent(agentId: string) {
      try {
        const { useGetAgentArtifactsLazyQuery } = await import('~/generated/graphql');
        const { load, result } = useGetAgentArtifactsLazyQuery({ agentId });
        await load();
        
        if (result.value?.agentArtifacts) {
          const artifacts: AgentArtifact[] = result.value.agentArtifacts.map(a => ({
            id: a.id,
            agentId: a.agentId,
            path: a.path,
            type: a.type as 'file' | 'image' | 'audio' | 'video' | 'pdf' | 'csv' | 'excel' | 'other',
            status: 'persisted' as ArtifactStatus, // Backend only stores persisted artifacts
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
            workspaceRoot: (a as any).workspaceRoot ?? null,
          }));
          this.artifactsByAgent.set(agentId, artifacts);
        }
      } catch (error) {
        console.error('Failed to fetch artifacts for agent:', agentId, error);
      }
    },
  },
});
