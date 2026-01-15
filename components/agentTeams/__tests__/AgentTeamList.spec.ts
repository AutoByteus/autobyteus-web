import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AgentTeamList from '../AgentTeamList.vue';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

// Mock Apollo Client
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: { query: vi.fn(), mutate: vi.fn() },
  }),
}));

// Mock AgentTeamCard
const AgentTeamCardStub = {
  template: '<div class="agent-team-card"></div>',
  props: ['teamDef'],
  emits: ['run-team', 'view-details']
};

describe('AgentTeamList', () => {
  const mockTeamDefs = [
    { id: 't1', name: 'Team Alpha', description: 'Alpha', role: 'test', memberNames: ['A', 'B'] },
    { id: 't2', name: 'Team Beta', description: 'Beta', role: 'test', memberNames: ['C'] }
  ];

  const mountComponent = () => {
    return mount(AgentTeamList, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              agentTeamDefinition: {
                agentTeamDefinitions: mockTeamDefs,
                loading: false,
                error: null
              }
            }
          })
        ],
        stubs: {
          AgentTeamCard: AgentTeamCardStub
        },
        mocks: {
          useRouter: () => ({ push: vi.fn() })
        }
      }
    });
  };

  it('should render list of teams', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAllComponents(AgentTeamCardStub);
    expect(cards).toHaveLength(2);
  });

  it('should clear agent config and set team config when running a team', async () => {
    const wrapper = mountComponent();
    const teamRunConfigStore = useTeamRunConfigStore();
    const agentRunConfigStore = useAgentRunConfigStore();
    const selectionStore = useAgentSelectionStore();

    await wrapper.findComponent(AgentTeamCardStub).vm.$emit('run-team', mockTeamDefs[0]);

    expect(agentRunConfigStore.clearConfig).toHaveBeenCalled();
    expect(teamRunConfigStore.setTemplate).toHaveBeenCalledWith(mockTeamDefs[0]);
    expect(selectionStore.clearSelection).toHaveBeenCalled();
  });
});
