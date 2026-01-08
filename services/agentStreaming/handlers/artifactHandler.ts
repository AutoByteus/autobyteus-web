import { useAgentArtifactsStore } from '~/stores/agentArtifactsStore';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { ArtifactPersistedPayload } from '../protocol/messageTypes';

export const handleArtifactPersisted = (
  payload: ArtifactPersistedPayload,
  context: AgentContext
): void => {
  const { agent_id, path, type, url } = payload;
  const store = useAgentArtifactsStore();
  
  const MEDIA_AND_DOC_TYPES = ['image', 'audio', 'video', 'pdf', 'csv', 'excel'];
  
  if (MEDIA_AND_DOC_TYPES.includes(type)) {
    // Media artifacts are created here (no streaming phase)
    store.createMediaArtifact({
        id: payload.artifact_id, // Ensure payload has artifact_id mapped if needed, or use createMediaArtifact's internal ID generator?
        // Wait, store type expects 'id' in the object?
        // Let's check store definition again.
        // Yes: createMediaArtifact(artifact: Omit<AgentArtifact, 'status' | 'createdAt'> ...)
        // AgentArtifact has 'id'.
        agentId: agent_id,
        path,
        type: type as any, // Cast to any or Specific union
        url: url || ''
    });
  } else {
    // File artifacts were already created during streaming
    store.markArtifactPersisted(agent_id, path);
  }
};
