import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentTeamRunStore } from '../agentTeamRunStore';
import { TeamStreamingService } from '~/services/agentStreaming';
import { AgentStatus } from '~/types/agent/AgentStatus';
import { AgentTeamStatus } from '~/types/agent/AgentTeamStatus';

const {
  mockConnect,
  mockDisconnect,
  mockMutate,
  mockClearActivities,
  teamContextsStoreMock,
  runHistoryStoreMock,
} = vi.hoisted(() => ({
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
  mockMutate: vi.fn(),
  mockClearActivities: vi.fn(),
  teamContextsStoreMock: {
    activeTeamContext: null as any,
    focusedMemberContext: null as any,
    getTeamContextById: vi.fn(),
    removeTeamContext: vi.fn(),
    promoteTemporaryTeamId: vi.fn(),
    lockConfig: vi.fn(),
  },
  runHistoryStoreMock: {
    markTeamAsActive: vi.fn(),
    refreshTreeQuietly: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('~/services/agentStreaming', () => ({
  TeamStreamingService: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    approveTool: vi.fn(),
    denyTool: vi.fn(),
  })),
}));

vi.mock('~/stores/windowNodeContextStore', () => ({
  useWindowNodeContextStore: () => ({
    getBoundEndpoints: () => ({
      teamWs: 'ws://node-a.example/ws/agent-team',
    }),
  }),
}));

vi.mock('~/stores/agentTeamContextsStore', () => ({
  useAgentTeamContextsStore: () => teamContextsStoreMock,
}));

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: () => ({
    mutate: mockMutate,
  }),
}));

vi.mock('~/stores/agentActivityStore', () => ({
  useAgentActivityStore: () => ({
    clearActivities: mockClearActivities,
  }),
}));

vi.mock('~/stores/runHistoryStore', () => ({
  useRunHistoryStore: () => runHistoryStoreMock,
}));

describe('agentTeamRunStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    teamContextsStoreMock.activeTeamContext = null;
    teamContextsStoreMock.focusedMemberContext = null;
    teamContextsStoreMock.getTeamContextById.mockReset();
  });

  it('connects team stream using bound node team WS endpoint', () => {
    const teamContext = {
      teamId: 'team-1',
      isSubscribed: false,
      unsubscribe: undefined as undefined | (() => void),
    };
    teamContextsStoreMock.getTeamContextById.mockReturnValue(teamContext);

    const store = useAgentTeamRunStore();
    store.connectToTeamStream('team-1');

    expect(TeamStreamingService).toHaveBeenCalledWith('ws://node-a.example/ws/agent-team');
    expect(mockConnect).toHaveBeenCalledWith('team-1', teamContext);
    expect(teamContext.isSubscribed).toBe(true);
    expect(typeof teamContext.unsubscribe).toBe('function');

    teamContext.unsubscribe?.();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('marks team as shutdown but keeps context for history restore after terminate', async () => {
    const unsubscribeSpy = vi.fn();
    const teamContext = {
      teamId: 'team-1',
      isSubscribed: true,
      currentStatus: AgentTeamStatus.Processing,
      unsubscribe: unsubscribeSpy,
      members: new Map([
        ['member-a', { state: { agentId: 'agent-a', currentStatus: AgentStatus.ProcessingUserInput } }],
        ['member-b', { state: { agentId: 'agent-b', currentStatus: AgentStatus.Idle } }],
      ]),
    };
    teamContextsStoreMock.getTeamContextById.mockReturnValue(teamContext);
    mockMutate.mockResolvedValue({});

    const store = useAgentTeamRunStore();
    await store.terminateTeamInstance('team-1');

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(teamContext.unsubscribe).toBeUndefined();
    expect(teamContext.isSubscribed).toBe(false);
    expect(teamContext.currentStatus).toBe(AgentTeamStatus.ShutdownComplete);
    expect(teamContext.members.get('member-a')?.state.currentStatus).toBe(AgentStatus.ShutdownComplete);
    expect(teamContext.members.get('member-b')?.state.currentStatus).toBe(AgentStatus.ShutdownComplete);
    expect(mockClearActivities).toHaveBeenCalledWith('agent-a');
    expect(mockClearActivities).toHaveBeenCalledWith('agent-b');
    expect(teamContextsStoreMock.removeTeamContext).not.toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('resubscribes and marks team active when sending to an offline persisted team', async () => {
    const focusedMember = {
      state: {
        agentId: 'member-1',
        conversation: {
          messages: [] as any[],
          updatedAt: '2026-02-21T00:00:00.000Z',
        },
      },
    };
    const teamContext = {
      teamId: 'team-1',
      focusedMemberName: 'professor',
      isSubscribed: false,
      config: {
        teamDefinitionId: 'team-def-1',
        workspaceId: 'ws-1',
        llmModelIdentifier: 'model-x',
        autoExecuteTools: false,
        memberOverrides: {},
      },
      members: new Map([['professor', focusedMember]]),
    };

    teamContextsStoreMock.activeTeamContext = teamContext;
    teamContextsStoreMock.focusedMemberContext = focusedMember;
    teamContextsStoreMock.getTeamContextById.mockImplementation((teamId: string) =>
      teamId === 'team-1' ? teamContext : null,
    );

    mockMutate.mockResolvedValue({
      data: {
        sendMessageToTeam: {
          success: true,
          teamId: 'team-1',
          message: 'ok',
        },
      },
      errors: [],
    });

    const store = useAgentTeamRunStore();
    await store.sendMessageToFocusedMember('hello from history', []);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            userInput: {
              content: 'hello from history',
              contextFiles: [],
            },
            teamId: 'team-1',
            targetMemberName: 'professor',
          },
        },
      }),
    );
    expect(runHistoryStoreMock.markTeamAsActive).toHaveBeenCalledWith('team-1');
    expect(runHistoryStoreMock.refreshTreeQuietly).toHaveBeenCalledTimes(1);
    expect(TeamStreamingService).toHaveBeenCalledWith('ws://node-a.example/ws/agent-team');
    expect(mockConnect).toHaveBeenCalledWith('team-1', teamContext);
    expect(teamContext.isSubscribed).toBe(true);
  });
});
