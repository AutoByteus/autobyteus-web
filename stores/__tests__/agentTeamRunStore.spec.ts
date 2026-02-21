import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentTeamRunStore } from '../agentTeamRunStore';
import { TeamStreamingService } from '~/services/agentStreaming';
import { AgentStatus } from '~/types/agent/AgentStatus';
import { AgentTeamStatus } from '~/types/agent/AgentTeamStatus';

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGetTeamContextById = vi.fn();
const mockRemoveTeamContext = vi.fn();
const mockMutate = vi.fn();
const mockClearActivities = vi.fn();

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
  useAgentTeamContextsStore: () => ({
    getTeamContextById: mockGetTeamContextById,
    activeTeamContext: null,
    focusedMemberContext: null,
    removeTeamContext: mockRemoveTeamContext,
  }),
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

describe('agentTeamRunStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('connects team stream using bound node team WS endpoint', () => {
    const teamContext = {
      teamId: 'team-1',
      isSubscribed: false,
      unsubscribe: undefined as undefined | (() => void),
    };
    mockGetTeamContextById.mockReturnValue(teamContext);

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
    mockGetTeamContextById.mockReturnValue(teamContext);
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
    expect(mockRemoveTeamContext).not.toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
