import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import WorkspaceAgentRunsTreePanel from '../WorkspaceAgentRunsTreePanel.vue';

const flushPromises = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

const {
  runHistoryState,
  runHistoryStoreMock,
  workspaceStoreMock,
  selectionStoreMock,
  agentRunStoreMock,
  addToastMock,
} = vi.hoisted(() => {
  const state = {
    loading: false,
    error: null as string | null,
    selectedRunId: null as string | null,
    nodes: [
      {
        workspaceRootPath: '/ws/a',
        workspaceName: 'autobyteus_org',
        agents: [
          {
            agentDefinitionId: 'agent-def-1',
            agentName: 'SuperAgent',
            agentAvatarUrl: 'https://example.com/superagent.png',
            runs: [
              {
                runId: 'temp-1',
                summary: 'New - SuperAgent',
                lastActivityAt: '2026-01-01T01:00:00.000Z',
                lastKnownStatus: 'IDLE',
                isActive: false,
                source: 'draft',
                isDraft: true,
              },
              {
                runId: 'run-1',
                summary: 'Describe messaging bindings',
                lastActivityAt: '2026-01-01T00:00:00.000Z',
                lastKnownStatus: 'ACTIVE',
                isActive: true,
                source: 'history',
                isDraft: false,
              },
            ],
          },
        ],
      },
    ] as any[],
  };

  return {
    runHistoryState: state,
    runHistoryStoreMock: {
      get loading() {
        return state.loading;
      },
      get error() {
        return state.error;
      },
      get selectedRunId() {
        return state.selectedRunId;
      },
      fetchTree: vi.fn().mockResolvedValue(undefined),
      getTreeNodes: vi.fn(() => state.nodes),
      formatRelativeTime: vi.fn((iso: string) => (iso.includes('01:00') ? 'now' : '4h')),
      selectTreeRun: vi.fn().mockResolvedValue(undefined),
      createDraftRun: vi.fn().mockResolvedValue('temp-2'),
      createWorkspace: vi.fn(async (rootPath: string) => rootPath),
    },
    workspaceStoreMock: {
      fetchAllWorkspaces: vi.fn().mockResolvedValue(undefined),
    },
    selectionStoreMock: {
      selectedType: null as string | null,
      selectedInstanceId: null as string | null,
    },
    agentRunStoreMock: {
      terminateRun: vi.fn().mockResolvedValue(true),
    },
    addToastMock: vi.fn(),
  };
});

vi.mock('~/stores/runHistoryStore', () => ({
  useRunHistoryStore: () => runHistoryStoreMock,
}));

vi.mock('~/stores/workspace', () => ({
  useWorkspaceStore: () => workspaceStoreMock,
}));

vi.mock('~/stores/agentSelectionStore', () => ({
  useAgentSelectionStore: () => selectionStoreMock,
}));

vi.mock('~/stores/agentRunStore', () => ({
  useAgentRunStore: () => agentRunStoreMock,
}));

vi.mock('~/composables/useToasts', () => ({
  useToasts: () => ({
    addToast: addToastMock,
  }),
}));

describe('WorkspaceAgentRunsTreePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runHistoryState.loading = false;
    runHistoryState.error = null;
    runHistoryState.selectedRunId = null;
    selectionStoreMock.selectedType = null;
    selectionStoreMock.selectedInstanceId = null;
  });

  const mountComponent = () => mount(WorkspaceAgentRunsTreePanel, {
    global: {
      stubs: {
        Icon: { template: '<span class="icon-stub" />' },
      },
    },
  });

  it('loads workspace list and history tree on mount', async () => {
    mountComponent();
    await flushPromises();

    expect(workspaceStoreMock.fetchAllWorkspaces).toHaveBeenCalledTimes(1);
    expect(runHistoryStoreMock.fetchTree).toHaveBeenCalledTimes(1);
  });

  it('renders agent avatar image when the tree node provides avatar URL', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const avatar = wrapper.find('img[alt="SuperAgent avatar"]');
    expect(avatar.exists()).toBe(true);
    expect(avatar.attributes('src')).toBe('https://example.com/superagent.png');
  });

  it('tracks broken avatar per URL key so a changed avatar URL can recover', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const vm = wrapper.vm as any;
    const workspaceRootPath = '/ws/a';
    const agentDefinitionId = 'agent-def-1';
    const firstAvatarUrl = 'https://example.com/superagent.png';
    const replacementAvatarUrl = 'https://example.com/superagent-v2.png';

    expect(vm.showAgentAvatar(workspaceRootPath, agentDefinitionId, firstAvatarUrl)).toBe(true);
    vm.onAgentAvatarError(workspaceRootPath, agentDefinitionId, firstAvatarUrl);
    await nextTick();
    expect(vm.showAgentAvatar(workspaceRootPath, agentDefinitionId, firstAvatarUrl)).toBe(false);
    expect(vm.showAgentAvatar(workspaceRootPath, agentDefinitionId, replacementAvatarUrl)).toBe(true);
  });

  it('selects run via runHistoryStore.selectTreeRun and emits instance-selected', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const runButton = wrapper.findAll('button').find((button) =>
      button.text().includes('Describe messaging bindings'),
    );
    expect(runButton).toBeTruthy();

    await runButton!.trigger('click');
    await flushPromises();

    expect(runHistoryStoreMock.selectTreeRun).toHaveBeenCalledWith(
      expect.objectContaining({ runId: 'run-1', source: 'history' }),
    );
    expect(wrapper.emitted('instance-selected')).toEqual([
      [{ type: 'agent', instanceId: 'run-1' }],
    ]);
  });

  it('creates draft run from agent row plus button and emits instance-created', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const createButtons = wrapper.findAll('button[title="New run with this agent"]');
    expect(createButtons.length).toBe(1);

    await createButtons[0]!.trigger('click');
    await flushPromises();

    expect(runHistoryStoreMock.createDraftRun).toHaveBeenCalledWith({
      workspaceRootPath: '/ws/a',
      agentDefinitionId: 'agent-def-1',
    });
    expect(wrapper.emitted('instance-created')).toEqual([
      [{ type: 'agent', definitionId: 'agent-def-1' }],
    ]);
  });

  it('creates workspace from add workspace button prompt', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('/ws/new');
    const wrapper = mountComponent();
    await flushPromises();

    const addWorkspaceButton = wrapper.find('button[title="Add workspace"]');
    await addWorkspaceButton.trigger('click');
    await flushPromises();

    expect(runHistoryStoreMock.createWorkspace).toHaveBeenCalledWith('/ws/new');
    expect(workspaceStoreMock.fetchAllWorkspaces).toHaveBeenCalledTimes(2);
    promptSpy.mockRestore();
  });

  it('renders active status indicator for active runs', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const activeDot = wrapper.find('.bg-blue-500.animate-pulse');
    expect(activeDot.exists()).toBe(true);
  });

  it('does not render status indicator for inactive runs', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const statusDots = wrapper.findAll('span.bg-blue-500.animate-pulse');
    expect(statusDots).toHaveLength(1);
  });

  it('terminates active run from row action without selecting the row', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const terminateButton = wrapper.find('button[title="Terminate run"]');
    expect(terminateButton.exists()).toBe(true);

    await terminateButton.trigger('click');
    await flushPromises();

    expect(agentRunStoreMock.terminateRun).toHaveBeenCalledWith('run-1');
    expect(runHistoryStoreMock.selectTreeRun).not.toHaveBeenCalled();
  });

  it('shows an error toast when terminate fails', async () => {
    agentRunStoreMock.terminateRun.mockResolvedValueOnce(false);
    const wrapper = mountComponent();
    await flushPromises();

    const terminateButton = wrapper.find('button[title="Terminate run"]');
    await terminateButton.trigger('click');
    await flushPromises();

    expect(addToastMock).toHaveBeenCalledWith('Failed to terminate run. Please try again.', 'error');
  });
});
