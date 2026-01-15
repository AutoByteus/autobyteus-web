import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AgentList from '../AgentList.vue';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

// Mock Apollo Client
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      query: vi.fn(),
      mutate: vi.fn(),
    },
  }),
}));

// Mock AgentCard since we only need to test the list logic
const AgentCardStub = {
  template: '<div class="agent-card"></div>',
  props: ['agentDef'],
  emits: ['run-agent', 'view-details']
};

describe('AgentList', () => {
    const mockAgentDefs = [
        { id: '1', name: 'Agent Alpha', description: 'Alpha Desc' },
        { id: '2', name: 'Agent Beta', description: 'Beta Desc' }
    ];

  const mountComponent = () => {
    return mount(AgentList, {
      global: {
        plugins: [
            createTestingPinia({
                createSpy: vi.fn,
                initialState: {
                    agentDefinition: {
                        agentDefinitions: mockAgentDefs,
                        loading: false,
                        error: null
                    }
                }
            })
        ],
        stubs: {
          AgentCard: AgentCardStub,
          // router mock
          navigateTo: vi.fn()
        },
        mocks: {
            navigateTo: vi.fn() // Mock navigateTo globally
        }
      }
    });
  };

  it('should render list of agents', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAllComponents(AgentCardStub);
    expect(cards).toHaveLength(2);
  });

  it('should filter agents by search query', async () => {
    const wrapper = mountComponent();
    const searchInput = wrapper.find('input#agent-search');
    
    await searchInput.setValue('Beta');
    
    const cards = wrapper.findAllComponents(AgentCardStub);
    expect(cards).toHaveLength(1);
    expect(cards[0].props('agentDef').name).toBe('Agent Beta');
  });

  it('should prepare run config and navigate when agent run requested', async () => {
    const wrapper = mountComponent();
    const configStore = useAgentRunConfigStore();
    const selectionStore = useAgentSelectionStore();

    // Trigger run-agent on first card
    await wrapper.findComponent(AgentCardStub).vm.$emit('run-agent', mockAgentDefs[0]);

    expect(configStore.setTemplate).toHaveBeenCalledWith(mockAgentDefs[0]);
    expect(selectionStore.clearSelection).toHaveBeenCalled();
  });
});
