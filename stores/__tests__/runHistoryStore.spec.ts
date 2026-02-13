import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useRunHistoryStore } from '../runHistoryStore';

const {
  queryMock,
  windowNodeContextStoreMock,
  workspaceStoreMock,
  agentDefinitionStoreMock,
  agentContextsStoreMock,
  selectionStoreMock,
  agentRunConfigStoreMock,
  teamRunConfigStoreMock,
  agentRunStoreMock,
  llmProviderConfigStoreMock,
} = vi.hoisted(() => {
  const selection = {
    selectedType: null as string | null,
    selectedInstanceId: null as string | null,
    selectInstance: vi.fn((instanceId: string, type: string) => {
      selection.selectedInstanceId = instanceId;
      selection.selectedType = type;
    }),
    clearSelection: vi.fn(() => {
      selection.selectedType = null;
      selection.selectedInstanceId = null;
    }),
  };

  const instances = new Map<string, any>();

  return {
    queryMock: vi.fn(),
    windowNodeContextStoreMock: {
      waitForBoundBackendReady: vi.fn().mockResolvedValue(true),
      lastReadyError: null as string | null,
    },
    workspaceStoreMock: {
      workspacesFetched: true,
      allWorkspaces: [] as Array<{ workspaceId: string; absolutePath: string; name?: string }>,
      workspaces: {} as Record<string, any>,
      fetchAllWorkspaces: vi.fn().mockResolvedValue(undefined),
      createWorkspace: vi.fn().mockResolvedValue('ws-created'),
    },
    agentDefinitionStoreMock: {
      agentDefinitions: [{ id: 'agent-def-1', name: 'SuperAgent', avatarUrl: 'https://a' }],
      fetchAllAgentDefinitions: vi.fn().mockResolvedValue(undefined),
      getAgentDefinitionById: vi.fn((id: string) => {
        if (id === 'agent-def-1') {
          return { id, name: 'SuperAgent', avatarUrl: 'https://a' };
        }
        return null;
      }),
    },
    agentContextsStoreMock: {
      instances,
      hydrateFromProjection: vi.fn(),
      upsertProjectionContext: vi.fn((options: any) => {
        const existing = instances.get(options.runId);
        if (existing) {
          existing.config = { ...options.config };
          existing.state.agentId = options.runId;
          existing.state.conversation = options.conversation;
          existing.state.currentStatus = options.status ?? 'idle';
          return;
        }
        instances.set(options.runId, {
          config: { ...options.config },
          state: {
            agentId: options.runId,
            conversation: options.conversation,
            currentStatus: options.status ?? 'idle',
          },
          isSubscribed: false,
        });
      }),
      patchConfigOnly: vi.fn((runId: string, patch: any) => {
        const context = instances.get(runId);
        if (!context) {
          return false;
        }
        context.config = {
          ...context.config,
          ...patch,
        };
        return true;
      }),
      createInstanceFromTemplate: vi.fn().mockReturnValue('temp-123'),
      getInstance: vi.fn((id: string) => instances.get(id)),
    },
    selectionStoreMock: selection,
    agentRunConfigStoreMock: {
      clearConfig: vi.fn(),
      setTemplate: vi.fn(),
      setAgentConfig: vi.fn(),
      updateAgentConfig: vi.fn(),
    },
    teamRunConfigStoreMock: {
      clearConfig: vi.fn(),
    },
    agentRunStoreMock: {
      connectToAgentStream: vi.fn(),
    },
    llmProviderConfigStoreMock: {
      models: ['model-default'],
      fetchProvidersWithModels: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: () => ({
    query: queryMock,
  }),
}));

vi.mock('~/graphql/queries/runHistoryQueries', () => ({
  ListRunHistory: 'ListRunHistory',
  GetRunProjection: 'GetRunProjection',
  GetRunResumeConfig: 'GetRunResumeConfig',
}));

vi.mock('~/stores/windowNodeContextStore', () => ({
  useWindowNodeContextStore: () => windowNodeContextStoreMock,
}));

vi.mock('~/stores/workspace', () => ({
  useWorkspaceStore: () => workspaceStoreMock,
}));

vi.mock('~/stores/agentDefinitionStore', () => ({
  useAgentDefinitionStore: () => agentDefinitionStoreMock,
}));

vi.mock('~/stores/agentContextsStore', () => ({
  useAgentContextsStore: () => agentContextsStoreMock,
}));

vi.mock('~/stores/agentSelectionStore', () => ({
  useAgentSelectionStore: () => selectionStoreMock,
}));

vi.mock('~/stores/agentRunConfigStore', () => ({
  useAgentRunConfigStore: () => agentRunConfigStoreMock,
}));

vi.mock('~/stores/teamRunConfigStore', () => ({
  useTeamRunConfigStore: () => teamRunConfigStoreMock,
}));

vi.mock('~/stores/agentRunStore', () => ({
  useAgentRunStore: () => agentRunStoreMock,
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: () => llmProviderConfigStoreMock,
}));

describe('runHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    windowNodeContextStoreMock.waitForBoundBackendReady.mockResolvedValue(true);
    windowNodeContextStoreMock.lastReadyError = null;

    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.allWorkspaces = [];
    workspaceStoreMock.workspaces = {};
    workspaceStoreMock.fetchAllWorkspaces.mockResolvedValue(undefined);
    workspaceStoreMock.createWorkspace.mockResolvedValue('ws-created');

    agentDefinitionStoreMock.agentDefinitions = [
      { id: 'agent-def-1', name: 'SuperAgent', avatarUrl: 'https://a' },
    ];
    agentDefinitionStoreMock.fetchAllAgentDefinitions.mockResolvedValue(undefined);
    agentDefinitionStoreMock.getAgentDefinitionById.mockImplementation((id: string) => {
      if (id === 'agent-def-1') {
        return { id, name: 'SuperAgent', avatarUrl: 'https://a' };
      }
      return null;
    });

    agentContextsStoreMock.instances.clear();

    selectionStoreMock.selectedType = null;
    selectionStoreMock.selectedInstanceId = null;
    llmProviderConfigStoreMock.models = ['model-default'];
    llmProviderConfigStoreMock.fetchProvidersWithModels.mockResolvedValue(undefined);
  });

  it('fetches run history tree from GraphQL', async () => {
    queryMock.mockResolvedValueOnce({
      data: {
        listRunHistory: [
          {
            workspaceRootPath: '/ws/a',
            workspaceName: 'a',
            agents: [
              {
                agentDefinitionId: 'agent-def-1',
                agentName: 'SuperAgent',
                runs: [
                  {
                    runId: 'run-1',
                    summary: 'Do a task',
                    lastActivityAt: new Date().toISOString(),
                    lastKnownStatus: 'IDLE',
                    isActive: false,
                  },
                ],
              },
            ],
          },
        ],
      },
      errors: [],
    });

    const store = useRunHistoryStore();
    await store.fetchTree();

    expect(store.error).toBeNull();
    expect(store.workspaceGroups).toHaveLength(1);
    expect(store.workspaceGroups[0]?.agents[0]?.runs[0]?.runId).toBe('run-1');
  });

  it('returns backend readiness error on fetchTree when backend is not ready', async () => {
    windowNodeContextStoreMock.waitForBoundBackendReady.mockResolvedValueOnce(false);
    windowNodeContextStoreMock.lastReadyError = 'Backend down';

    const store = useRunHistoryStore();
    await store.fetchTree();

    expect(store.error).toContain('Backend down');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('opens a run, hydrates projection, selects instance, and connects stream when active', async () => {
    queryMock.mockImplementation(async ({ query }: { query: string }) => {
      if (query === 'GetRunProjection') {
        return {
          data: {
            getRunProjection: {
              runId: 'run-1',
              summary: 'Describe messaging bindings',
              lastActivityAt: '2026-01-01T00:00:00.000Z',
              conversation: [
                { kind: 'message', role: 'user', content: 'hello', ts: 1700000000 },
                { kind: 'message', role: 'assistant', content: 'hi', ts: 1700000010 },
              ],
            },
          },
          errors: [],
        };
      }
      if (query === 'GetRunResumeConfig') {
        return {
          data: {
            getRunResumeConfig: {
              runId: 'run-1',
              isActive: true,
              manifestConfig: {
                agentDefinitionId: 'agent-def-1',
                workspaceRootPath: '/ws/a',
                llmModelIdentifier: 'model-x',
                llmConfig: { temperature: 0.3 },
                autoExecuteTools: false,
                skillAccessMode: 'PRELOADED_ONLY',
              },
              editableFields: {
                llmModelIdentifier: false,
                llmConfig: false,
                autoExecuteTools: false,
                skillAccessMode: false,
                workspaceRootPath: false,
              },
            },
          },
          errors: [],
        };
      }
      throw new Error(`Unexpected query: ${String(query)}`);
    });

    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'a' },
    ];

    const store = useRunHistoryStore();
    store.workspaceGroups = [
      {
        workspaceRootPath: '/ws/a',
        workspaceName: 'a',
        agents: [
          {
            agentDefinitionId: 'agent-def-1',
            agentName: 'SuperAgent',
            runs: [
              {
                runId: 'run-1',
                summary: 'Describe messaging bindings',
                lastActivityAt: '2026-01-01T00:00:00.000Z',
                lastKnownStatus: 'ACTIVE',
                isActive: true,
              },
            ],
          },
        ],
      },
    ];

    await store.openRun('run-1');

    expect(agentContextsStoreMock.upsertProjectionContext).toHaveBeenCalledTimes(1);
    expect(selectionStoreMock.selectInstance).toHaveBeenCalledWith('run-1', 'agent');
    expect(agentRunConfigStoreMock.clearConfig).toHaveBeenCalled();
    expect(teamRunConfigStoreMock.clearConfig).toHaveBeenCalled();
    expect(agentRunStoreMock.connectToAgentStream).toHaveBeenCalledWith('run-1');
    expect(store.selectedRunId).toBe('run-1');
  });

  it('does not clobber live active context state when reopening an already subscribed run', async () => {
    queryMock.mockImplementation(async ({ query }: { query: string }) => {
      if (query === 'GetRunProjection') {
        return {
          data: {
            getRunProjection: {
              runId: 'run-1',
              summary: 'Describe messaging bindings',
              lastActivityAt: '2026-01-01T00:00:00.000Z',
              conversation: [
                { kind: 'message', role: 'user', content: 'hello', ts: 1700000000 },
                { kind: 'message', role: 'assistant', content: 'hi', ts: 1700000010 },
              ],
            },
          },
          errors: [],
        };
      }
      if (query === 'GetRunResumeConfig') {
        return {
          data: {
            getRunResumeConfig: {
              runId: 'run-1',
              isActive: true,
              manifestConfig: {
                agentDefinitionId: 'agent-def-1',
                workspaceRootPath: '/ws/a',
                llmModelIdentifier: 'model-x',
                llmConfig: { temperature: 0.3 },
                autoExecuteTools: false,
                skillAccessMode: 'PRELOADED_ONLY',
              },
              editableFields: {
                llmModelIdentifier: false,
                llmConfig: false,
                autoExecuteTools: false,
                skillAccessMode: false,
                workspaceRootPath: false,
              },
            },
          },
          errors: [],
        };
      }
      throw new Error(`Unexpected query: ${String(query)}`);
    });

    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'a' },
    ];

    agentContextsStoreMock.instances.set('run-1', {
      isSubscribed: true,
      config: {
        agentDefinitionId: 'agent-def-1',
        agentDefinitionName: 'SuperAgent',
        agentAvatarUrl: 'https://a',
        llmModelIdentifier: 'model-old',
        workspaceId: 'ws-1',
        autoExecuteTools: true,
        skillAccessMode: 'ALL',
        llmConfig: null,
        isLocked: false,
      },
      state: {
        agentId: 'run-1',
        currentStatus: 'idle',
        conversation: {
          id: 'run-1',
          messages: [{ type: 'user', text: 'existing', timestamp: new Date(), contextFilePaths: [] }],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:01.000Z',
          agentDefinitionId: 'agent-def-1',
        },
      },
    });

    const store = useRunHistoryStore();
    await store.openRun('run-1');

    expect(agentContextsStoreMock.upsertProjectionContext).not.toHaveBeenCalled();
    expect(agentContextsStoreMock.patchConfigOnly).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        llmModelIdentifier: 'model-x',
        isLocked: true,
      }),
    );
    const context = agentContextsStoreMock.instances.get('run-1');
    expect(context.state.currentStatus).toBe('idle');
    expect(context.state.conversation.messages[0]?.text).toBe('existing');
  });

  it('creates draft run for selected workspace and agent', async () => {
    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'a' },
    ];
    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.createWorkspace.mockResolvedValueOnce('ws-1');

    const store = useRunHistoryStore();
    const runId = await store.createDraftRun({
      workspaceRootPath: '/ws/a',
      agentDefinitionId: 'agent-def-1',
    });

    expect(agentRunConfigStoreMock.setTemplate).toHaveBeenCalled();
    expect(agentRunConfigStoreMock.updateAgentConfig).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      llmModelIdentifier: 'model-default',
    });
    expect(workspaceStoreMock.createWorkspace).toHaveBeenCalledWith({ root_path: '/ws/a' });
    expect(selectionStoreMock.clearSelection).toHaveBeenCalled();
    expect(runId).toBe('temp-123');
    expect(store.selectedRunId).toBe('temp-123');
  });

  it('reuses model from existing context when creating draft run', async () => {
    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'a' },
    ];
    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.createWorkspace.mockResolvedValueOnce('ws-1');

    agentContextsStoreMock.instances.set('run-previous', {
      config: {
        agentDefinitionId: 'agent-def-1',
        agentDefinitionName: 'SuperAgent',
        workspaceId: 'ws-1',
        llmModelIdentifier: 'model-previous',
        autoExecuteTools: false,
        skillAccessMode: 'PRELOADED_ONLY',
        isLocked: true,
      },
      state: {
        conversation: {
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });

    const store = useRunHistoryStore();
    await store.createDraftRun({
      workspaceRootPath: '/ws/a',
      agentDefinitionId: 'agent-def-1',
    });

    expect(agentRunConfigStoreMock.setAgentConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        llmModelIdentifier: 'model-previous',
        workspaceId: 'ws-1',
        isLocked: false,
      }),
    );
    expect(workspaceStoreMock.createWorkspace).toHaveBeenCalledWith({ root_path: '/ws/a' });
  });

  it('revalidates workspace id via backend creation even when local cache has matching root path', async () => {
    workspaceStoreMock.workspacesFetched = true;
    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'stale-ws-id', absolutePath: '/ws/a', name: 'a' },
    ];
    workspaceStoreMock.createWorkspace.mockResolvedValueOnce('fresh-ws-id');

    const store = useRunHistoryStore();
    const workspaceId = await store.ensureWorkspaceByRootPath('/ws/a');

    expect(workspaceId).toBe('fresh-ws-id');
    expect(workspaceStoreMock.createWorkspace).toHaveBeenCalledWith({ root_path: '/ws/a' });
  });

  it('projects persisted history and temp drafts into workspace tree', () => {
    const store = useRunHistoryStore();
    store.workspaceGroups = [
      {
        workspaceRootPath: '/ws/a',
        workspaceName: 'Alpha',
        agents: [
          {
            agentDefinitionId: 'agent-def-1',
            agentName: 'SuperAgent',
            runs: [
              {
                runId: 'run-1',
                summary: 'Persisted run',
                lastActivityAt: '2026-01-01T00:00:00.000Z',
                lastKnownStatus: 'IDLE',
                isActive: false,
              },
            ],
          },
        ],
      },
    ];

    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'Alpha' },
      { workspaceId: 'ws-2', absolutePath: '/ws/b', name: 'Beta' },
    ];
    workspaceStoreMock.workspaces = {
      'ws-1': { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'Alpha', workspaceConfig: {} },
      'ws-2': { workspaceId: 'ws-2', absolutePath: '/ws/b', name: 'Beta', workspaceConfig: {} },
    };

    agentContextsStoreMock.instances.set('temp-1', {
      config: {
        workspaceId: 'ws-1',
        agentDefinitionId: 'agent-def-1',
        agentDefinitionName: 'SuperAgent',
      },
      state: {
        currentStatus: 'uninitialized',
        conversation: {
          id: 'temp-1',
          messages: [],
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });

    const nodes = store.getTreeNodes();

    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.workspaceRootPath).toBe('/ws/a');

    const alphaAgent = nodes[0]?.agents[0];
    expect(alphaAgent?.runs.map(run => run.runId)).toEqual(['temp-1', 'run-1']);
    expect(alphaAgent?.runs[0]?.source).toBe('draft');
    expect(alphaAgent?.runs[1]?.source).toBe('history');

    expect(nodes[1]).toEqual({
      workspaceRootPath: '/ws/b',
      workspaceName: 'Beta',
      agents: [],
    });
  });

  it('overlays persisted run status with matching live context only', () => {
    const store = useRunHistoryStore();
    store.workspaceGroups = [
      {
        workspaceRootPath: '/ws/a',
        workspaceName: 'Alpha',
        agents: [
          {
            agentDefinitionId: 'agent-def-1',
            agentName: 'SuperAgent',
            runs: [
              {
                runId: 'run-a',
                summary: 'Run A',
                lastActivityAt: '2026-01-01T00:00:00.000Z',
                lastKnownStatus: 'IDLE',
                isActive: false,
              },
              {
                runId: 'run-b',
                summary: 'Run B',
                lastActivityAt: '2026-01-01T00:00:00.000Z',
                lastKnownStatus: 'IDLE',
                isActive: false,
              },
            ],
          },
        ],
      },
    ];

    workspaceStoreMock.allWorkspaces = [
      { workspaceId: 'ws-1', absolutePath: '/ws/a', name: 'Alpha' },
    ];

    agentContextsStoreMock.instances.set('run-b', {
      config: {
        workspaceId: 'ws-1',
        agentDefinitionId: 'agent-def-1',
        agentDefinitionName: 'SuperAgent',
      },
      state: {
        currentStatus: 'bootstrapping',
        conversation: {
          id: 'run-b',
          messages: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      },
    });

    const nodes = store.getTreeNodes();
    const runA = nodes[0]?.agents[0]?.runs.find((run) => run.runId === 'run-a');
    const runB = nodes[0]?.agents[0]?.runs.find((run) => run.runId === 'run-b');

    expect(runA?.isActive).toBe(false);
    expect(runA?.lastKnownStatus).toBe('IDLE');
    expect(runB?.isActive).toBe(true);
    expect(runB?.lastKnownStatus).toBe('ACTIVE');
    expect(runB?.lastActivityAt).toBe('2026-01-03T00:00:00.000Z');
  });

  it('selectTreeRun delegates to openRun for history rows', async () => {
    const store = useRunHistoryStore();
    const openRunSpy = vi.spyOn(store, 'openRun').mockResolvedValue(undefined);

    await store.selectTreeRun({
      runId: 'run-1',
      summary: 'Persisted run',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      lastKnownStatus: 'IDLE',
      isActive: false,
      source: 'history',
      isDraft: false,
    });

    expect(openRunSpy).toHaveBeenCalledWith('run-1');
  });

  it('selectTreeRun selects local temp context for draft rows', async () => {
    const store = useRunHistoryStore();
    agentContextsStoreMock.instances.set('temp-1', {
      config: { workspaceId: 'ws-1' },
      state: { conversation: { messages: [] } },
    });

    await store.selectTreeRun({
      runId: 'temp-1',
      summary: 'New - SuperAgent',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      lastKnownStatus: 'IDLE',
      isActive: false,
      source: 'draft',
      isDraft: true,
    });

    expect(selectionStoreMock.selectInstance).toHaveBeenCalledWith('temp-1', 'agent');
    expect(store.selectedRunId).toBe('temp-1');
    expect(agentRunConfigStoreMock.clearConfig).toHaveBeenCalled();
    expect(teamRunConfigStoreMock.clearConfig).toHaveBeenCalled();
  });
});
