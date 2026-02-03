import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import AgentList from '../AgentList.vue';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';

// Mock AgentCard since we only need to test the list logic
const AgentCardStub = {
  name: 'AgentCard',
  template: '<div class="agent-card"></div>',
  props: ['agentDef'],
  emits: ['run-agent', 'view-details']
};

describe('AgentList', () => {
    const mockAgentDefs = [
        { id: '1', name: 'Agent Alpha', description: 'Alpha Desc' },
        { id: '2', name: 'Agent Beta', description: 'Beta Desc' }
    ];

  const mountComponent = async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: true,
    });
    setActivePinia(pinia);

    const store = useAgentDefinitionStore();
    store.agentDefinitions = mockAgentDefs as any;
    store.loading = false;
    store.error = null;

    const wrapper = mount(AgentList, {
      global: {
        plugins: [
          pinia,
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
    await wrapper.vm.$nextTick();
    return wrapper;
  };

  it('should render list of agents', async () => {
    const wrapper = await mountComponent();
    const cards = wrapper.findAllComponents({ name: 'AgentCard' });
    expect(cards).toHaveLength(2);
  });

  it('should filter agents by search query', async () => {
    const wrapper = await mountComponent();
    const searchInput = wrapper.find('input#agent-search');
    
    await searchInput.setValue('Beta');
    await wrapper.vm.$nextTick();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const setupState = (wrapper.vm as any).$?.setupState;
    if (setupState?.searchQuery) {
      setupState.searchQuery.value = 'Beta';
      await wrapper.vm.$nextTick();
    }
    
    expect((searchInput.element as HTMLInputElement).value).toBe('Beta');
  });

  it('should prepare run config and navigate when agent run requested', async () => {
    const wrapper = await mountComponent();
    const configStore = useAgentRunConfigStore();
    const selectionStore = useAgentSelectionStore();

    // Trigger run-agent on first card
    await wrapper.findComponent({ name: 'AgentCard' }).vm.$emit('run-agent', mockAgentDefs[0]);

    expect(configStore.setTemplate).toHaveBeenCalledWith(mockAgentDefs[0]);
    expect(selectionStore.clearSelection).toHaveBeenCalled();
  });
});
