import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { handleArtifactPersisted } from '../artifactHandler';
import { useAgentArtifactsStore } from '~/stores/agentArtifactsStore';
import type { ArtifactPersistedPayload } from '../../protocol/messageTypes';
import type { AgentContext } from '~/types/agent/AgentContext';

describe('artifactHandler', () => {
  let mockContext: AgentContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockContext = {} as AgentContext; // Handler doesn't use context currently
  });

  describe('handleArtifactPersisted', () => {
    it('should mark file artifact as persisted when type is file', () => {
      const store = useAgentArtifactsStore();
      const agentId = 'agent-1';
      const path = 'src/app.py';
      
      // First create a pending artifact (simulating streaming flow)
      store.createPendingArtifact(agentId, path, 'file');
      store.finalizeArtifactStream(agentId);
      
      const payload: ArtifactPersistedPayload = {
        artifact_id: 'artifact-123',
        status: 'persisted',
        path,
        agent_id: agentId,
        type: 'file',
      };
      
      handleArtifactPersisted(payload, mockContext);
      
      const artifacts = store.getArtifactsForAgent(agentId);
      expect(artifacts[0].status).toBe('persisted');
    });

    it('should create image artifact directly when type is image', () => {
      const store = useAgentArtifactsStore();
      const agentId = 'agent-1';
      const path = 'images/generated.png';
      const url = 'http://localhost:8000/rest/files/images/generated.png';
      
      const payload: ArtifactPersistedPayload = {
        artifact_id: 'artifact-456',
        status: 'persisted',
        path,
        agent_id: agentId,
        type: 'image',
        url,
      };
      
      handleArtifactPersisted(payload, mockContext);
      
      const artifacts = store.getArtifactsForAgent(agentId);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].type).toBe('image');
      expect(artifacts[0].status).toBe('persisted');
      expect(artifacts[0].url).toBe(url);
    });

    it('should create audio artifact directly when type is audio', () => {
      const store = useAgentArtifactsStore();
      const agentId = 'agent-1';
      const path = 'audio/speech.mp3';
      const url = 'http://localhost:8000/rest/files/audio/speech.mp3';
      
      const payload: ArtifactPersistedPayload = {
        artifact_id: 'artifact-789',
        status: 'persisted',
        path,
        agent_id: agentId,
        type: 'audio',
        url,
      };
      
      handleArtifactPersisted(payload, mockContext);
      
      const artifacts = store.getArtifactsForAgent(agentId);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].type).toBe('audio');
      expect(artifacts[0].status).toBe('persisted');
      expect(artifacts[0].url).toBe(url);
    });
  });
});
