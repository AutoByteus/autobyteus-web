import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import AgentTeamList from '../AgentTeamList.vue';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';

const { AgentTeamCardStub } = vi.hoisted(() => ({
  AgentTeamCardStub: {
    name: 'AgentTeamCard',
    template: '<div class="agent-team-card"></div>',
    props: ['teamDef'],
    emits: ['run-team', 'view-details'],
  },
}));

vi.mock('../AgentTeamCard.vue', () => ({
  default: AgentTeamCardStub,
}));

describe('AgentTeamList', () => {
  const mockTeamDefs = [
    {
      id: 't1',
      name: 'Team Alpha',
      description: 'Alpha description',
      role: 'Creative',
      coordinatorMemberName: 'alpha_lead',
      nodes: [
        { memberName: 'alpha_lead', referenceType: 'AGENT', referenceId: 'a1' },
      ],
    },
    {
      id: 't2',
      name: 'Team Beta',
      description: 'Beta description',
      role: 'Ops',
      coordinatorMemberName: 'beta_lead',
      nodes: [
        { memberName: 'beta_lead', referenceType: 'AGENT', referenceId: 'a2' },
      ],
    },
  ];

  const mountComponent = async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: true,
    });
    setActivePinia(pinia);

    const store = useAgentTeamDefinitionStore();
    store.agentTeamDefinitions = mockTeamDefs as any;
    store.loading = false as any;
    store.error = null as any;

    const wrapper = mount(AgentTeamList, {
      global: {
        plugins: [pinia],
        stubs: {
          AgentTeamCard: AgentTeamCardStub,
        },
      },
    });

    await wrapper.vm.$nextTick();
    return wrapper;
  };

  it('renders list of teams', async () => {
    const wrapper = await mountComponent();
    const cards = wrapper.findAllComponents({ name: 'AgentTeamCard' });
    expect(cards).toHaveLength(2);
  });

  it('filters teams by name search query', async () => {
    const wrapper = await mountComponent();
    (wrapper.vm as any).searchQuery = 'Beta';
    await wrapper.vm.$nextTick();

    const filteredTeams = (wrapper.vm as any).filteredTeamDefinitions as Array<{ name: string }>;
    expect(filteredTeams).toHaveLength(1);
    expect(filteredTeams[0]?.name).toBe('Team Beta');
  });

  it('clears agent config and sets team config when running a team', async () => {
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
