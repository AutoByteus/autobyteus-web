import { setActivePinia, createPinia } from 'pinia';
import { useAgentArtifactsStore } from '~/stores/agentArtifactsStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AgentArtifactsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should create a pending artifact and set it as active', () => {
    const store = useAgentArtifactsStore();
    const agentId = 'agent-1';
    
    store.createPendingArtifact(agentId, 'test.py', 'file');

    const active = store.getActiveStreamingArtifact(agentId);
    expect(active).toBeTruthy();
    expect(active?.path).toBe('test.py');
    expect(active?.status).toBe('streaming');
    expect(active?.content).toBe('');

    const all = store.getArtifactsForAgent(agentId);
    expect(all).toHaveLength(1);
    expect(all[0]).toBe(active);
  });

  it('should append content to the active artifact', () => {
    const store = useAgentArtifactsStore();
    const agentId = 'agent-1';
    store.createPendingArtifact(agentId, 'test.py');

    store.appendArtifactContent(agentId, 'print(');
    store.appendArtifactContent(agentId, '"hello")');

    const active = store.getActiveStreamingArtifact(agentId);
    expect(active?.content).toBe('print("hello")');
  });

  it('should finalize artifact stream and clear active state', () => {
    const store = useAgentArtifactsStore();
    const agentId = 'agent-1';
    store.createPendingArtifact(agentId, 'test.py');
    store.appendArtifactContent(agentId, 'code');
    
    store.finalizeArtifactStream(agentId);

    const active = store.getActiveStreamingArtifact(agentId);
    expect(active).toBeNull(); // Should be cleared

    const all = store.getArtifactsForAgent(agentId);
    expect(all[0].status).toBe('pending_approval');
    expect(all[0].content).toBe('code');
  });

  it('should mark artifact as persisted', () => {
    const store = useAgentArtifactsStore();
    const agentId = 'agent-1';
    store.createPendingArtifact(agentId, 'test.py');
    store.finalizeArtifactStream(agentId);
    
    store.markArtifactPersisted(agentId, 'test.py');
    
    const all = store.getArtifactsForAgent(agentId);
    expect(all[0].status).toBe('persisted');
  });
});
