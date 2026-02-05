import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentMemoryViewStore } from '~/stores/agentMemoryViewStore';
import { getApolloClient } from '~/utils/apolloClient';

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: vi.fn(),
}));

describe('agentMemoryViewStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('setSelectedAgentId fetches memory view', async () => {
    const queryMock = vi.fn().mockResolvedValue({
      data: {
        getAgentMemoryView: {
          agentId: 'agent-1',
          workingContext: [],
          episodic: [],
          semantic: [],
          rawTraces: [],
        },
      },
    });
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any);

    const store = useAgentMemoryViewStore();
    await store.setSelectedAgentId('agent-1');

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(store.memoryView?.agentId).toBe('agent-1');
    expect(store.selectedAgentId).toBe('agent-1');
  });

  it('setIncludeRawTraces triggers fetch when enabled', async () => {
    const queryMock = vi.fn().mockResolvedValue({
      data: {
        getAgentMemoryView: {
          agentId: 'agent-2',
          workingContext: [],
          episodic: [],
          semantic: [],
          rawTraces: [],
        },
      },
    });
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any);

    const store = useAgentMemoryViewStore();
    store.selectedAgentId = 'agent-2';

    await store.setIncludeRawTraces(true);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const variables = queryMock.mock.calls[0][0].variables;
    expect(variables.includeRawTraces).toBe(true);
  });

  it('fetchMemoryView preserves memoryView on error', async () => {
    const queryMock = vi.fn().mockRejectedValue(new Error('boom'));
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any);

    const store = useAgentMemoryViewStore();
    store.selectedAgentId = 'agent-3';
    store.memoryView = {
      agentId: 'agent-keep',
      workingContext: [],
      episodic: [],
      semantic: [],
      rawTraces: [],
    };

    await store.fetchMemoryView();

    expect(store.error).toBe('boom');
    expect(store.memoryView?.agentId).toBe('agent-keep');
  });

  it('clearSelection resets state', () => {
    const store = useAgentMemoryViewStore();
    store.selectedAgentId = 'agent-4';
    store.memoryView = {
      agentId: 'agent-4',
      workingContext: [],
      episodic: [],
      semantic: [],
      rawTraces: [],
    };

    store.clearSelection();

    expect(store.selectedAgentId).toBeNull();
    expect(store.memoryView).toBeNull();
    expect(store.includeRawTraces).toBe(false);
  });
});
