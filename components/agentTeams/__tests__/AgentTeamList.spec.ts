import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import AgentTeamList from '../AgentTeamList.vue';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';

const { AgentTeamCardStub } = vi.hoisted(() => ({
  AgentTeamCardStub: {
    name: 'AgentTeamCard',
    template: '<div class="agent-team-card"></div>',
    props: ['teamDef'],
    emits: ['run-team', 'view-details']
  }
}));

vi.mock('../AgentTeamCard.vue', () => ({
  default: AgentTeamCardStub,
}));

describe('AgentTeamList', () => {
  const mockTeamDefs = [
    { id: 't1', name: 'Team Alpha', description: 'Alpha', role: 'test', memberNames: ['A', 'B'] },
    { id: 't2', name: 'Team Beta', description: 'Beta', role: 'test', memberNames: ['C'] }
  ];

  const mountComponent = async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: true,
    });
    setActivePinia(pinia);

    const store = useAgentTeamDefinitionStore();
    store.agentTeamDefinitions = mockTeamDefs as any;
    store.loading = false;
    store.error = null;

    const wrapper = shallowMount(AgentTeamList, {
      global: {
        plugins: [
          pinia,
        ],
        stubs: {
          AgentTeamCard: AgentTeamCardStub
        },
        mocks: {
          useRouter: () => ({ push: vi.fn() })
        }
      }
    });
    await wrapper.vm.$nextTick();
    return wrapper;
  };

  it('should render list of teams', async () => {
    const wrapper = await mountComponent();
    const cards = wrapper.findAllComponents({ name: 'AgentTeamCard' });
    expect(cards).toHaveLength(2);
  });

  it('should clear agent config and set team config when running a team', async () => {
    const wrapper = await mountComponent();
    const teamRunConfigStore = useTeamRunConfigStore();
    const agentRunConfigStore = useAgentRunConfigStore();
    const selectionStore = useAgentSelectionStore();

    await wrapper.findComponent({ name: 'AgentTeamCard' }).vm.$emit('run-team', mockTeamDefs[0]);

    expect(agentRunConfigStore.clearConfig).toHaveBeenCalled();
    expect(teamRunConfigStore.setTemplate).toHaveBeenCalledWith(mockTeamDefs[0]);
    expect(selectionStore.clearSelection).toHaveBeenCalled();
  });
});
