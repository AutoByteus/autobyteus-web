import { defineStore } from 'pinia';
import { useAgentContextsStore } from '~/stores/agentContextsStore';

export type ArtifactStatus = 'streaming' | 'pending_approval' | 'persisted' | 'failed';

export interface AgentArtifact {
  id: string; // Unique ID (UUID or Path for streaming)
  agentId: string;
  path: string; // Relative path (e.g., "src/hello.py")
  type: 'file' | 'image' | 'video' | 'pdf' | 'other';
  status: ArtifactStatus;
  content?: string; // Content buffer for text files
  url?: string; // URL for media files
  createdAt: string;
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
     */
    createPendingArtifact(agentId: string, path: string, type: 'file' | 'image' = 'file') {
      const artifact: AgentArtifact = {
        id: `pending-${Date.now()}`, // Temp ID
        agentId,
        path,
        type,
        status: 'streaming',
        content: '',
        createdAt: new Date().toISOString(),
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
        // Clear active streamer so we don't accidentally append to it later
        this.activeStreamingArtifactByAgent.set(agentId, null);
      }
    },

    /**
     * Mark artifact as persisted (Tool was approved and executed)
     * This might be called by a separate event or optimistic update
     */
    markArtifactPersisted(agentId: string, path: string) {
        const artifacts = this.artifactsByAgent.get(agentId) || [];
        // Find the pending one matching path
        const artifact = artifacts.find(a => a.path === path && a.status === 'pending_approval');
        if (artifact) {
            artifact.status = 'persisted';
        }
    },
    
    /**
     * Mark artifact as failed/cancelled
     */
    markArtifactFailed(agentId: string, path: string) {
        const artifacts = this.artifactsByAgent.get(agentId) || [];
        const artifact = artifacts.find(a => a.path === path && a.status === 'pending_approval');
        if (artifact) {
            artifact.status = 'failed';
        }
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
            type: a.type as 'file' | 'image' | 'video' | 'pdf' | 'other',
            status: 'persisted' as ArtifactStatus, // Backend only stores persisted artifacts
            createdAt: a.createdAt,
          }));
          this.artifactsByAgent.set(agentId, artifacts);
        }
      } catch (error) {
        console.error('Failed to fetch artifacts for agent:', agentId, error);
      }
    },
  },
});

