import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AgentRunConfigForm from '../AgentRunConfigForm.vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';

// Mock child components
vi.mock('../WorkspacePathInput.vue', () => ({
  default: {
    template: '<input class="workspace-input-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :disabled="disabled" />',
    props: ['modelValue', 'disabled', 'isLoading', 'error', 'isLoaded'],
  }
}));

vi.mock('~/components/agentTeams/SearchableGroupedSelect.vue', () => ({
  default: {
    name: 'SearchableGroupedSelect',
    template: '<div class="searchable-select-stub"></div>',
    props: ['modelValue', 'disabled', 'options'],
    emits: ['update:modelValue'],
  }
}));

describe('AgentRunConfigForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useLLMProviderConfigStore();
    store.fetchProvidersWithModels = vi.fn().mockResolvedValue([]);
  });

  const mockConfig = {
    agentDefinitionId: 'def-1',
    agentDefinitionName: 'TestAgent',
    llmModelIdentifier: 'gpt-4',
    workspaceId: null,
    autoExecuteTools: false,
    isLocked: false,
  };

  const mockAgentDef = {
    id: 'def-1',
    name: 'TestAgent',
    // ... other fields not needed for this component mostly
  };

  it('renders correctly', () => {
    const wrapper = mount(AgentRunConfigForm, {
      props: {
        config: mockConfig,
        agentDefinition: mockAgentDef as any,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
      },
    });

    expect(wrapper.text()).toContain('TestAgent'); // Agent name displayed
    expect(wrapper.find('.searchable-select-stub').exists()).toBe(true); // Model selector
    expect(wrapper.find('.workspace-input-stub').exists()).toBe(true); // Workspace input
  });

  it('populates model options from store', async () => {
    const store = useLLMProviderConfigStore();
    store.providersWithModels = [
      {
        provider: 'OpenAI',
        models: [
          { modelIdentifier: 'gpt-4', name: 'GPT-4', value: 'gpt-4', canonicalName: 'gpt-4', provider: 'openai', runtime: 'python' },
        ]
      }
    ];

    const wrapper = mount(AgentRunConfigForm, {
      props: {
        config: mockConfig,
        agentDefinition: mockAgentDef as any,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
      },
    });

    await wrapper.vm.$nextTick();
    
    const selectStub = wrapper.findComponent({ name: 'SearchableGroupedSelect' });
    const options = selectStub.props('options');
    
    expect(options).toHaveLength(1);
    expect(options[0].items[0].name).toBe('gpt-4'); // Now displays modelIdentifier for disambiguation
  });

  it('disables fields when config is locked', () => {
    const wrapper = mount(AgentRunConfigForm, {
      props: {
        config: { ...mockConfig, isLocked: true },
        agentDefinition: mockAgentDef as any,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
      },
    });

    const selectStub = wrapper.findComponent({ name: 'SearchableGroupedSelect' }) // or find by class
                       || wrapper.find('.searchable-select-stub');
    const input = wrapper.find('.workspace-input-stub');
    const checkbox = wrapper.find('input[type="checkbox"]');

    expect(wrapper.findComponent({ name: 'SearchableGroupedSelect' }).props('disabled')).toBe(true);
    expect(input.attributes('disabled')).toBeDefined();
    expect(checkbox.attributes('disabled')).toBeDefined();
  });

  it('updates config when fields change', async () => {
    // Setup store so select has options
    const store = useLLMProviderConfigStore();
    store.providersWithModels = [
      {
        provider: 'OpenAI',
        models: [
            { modelIdentifier: 'gpt-3.5', name: 'GPT-3.5', value: 'gpt-3.5', canonicalName: 'gpt-3.5', provider: 'openai', runtime: 'python' }
        ]
      }
    ];

    const localConfig = { ...mockConfig };
    
    const wrapper = mount(AgentRunConfigForm, {
      props: {
        config: localConfig,
        agentDefinition: mockAgentDef as any,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
      },
    });

    // Change autoExecuteTools
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    expect(localConfig.autoExecuteTools).toBe(true);
    
    // Change Model
    // Change Model
    const selectStub = wrapper.findComponent({ name: 'SearchableGroupedSelect' });
    await selectStub.vm.$emit('update:modelValue', 'gpt-3.5');
    
    expect(localConfig.llmModelIdentifier).toBe('gpt-3.5');
  });
});
