import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MemberOverrideItem from '../MemberOverrideItem.vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';

// Mock child components
vi.mock('~/components/agentTeams/SearchableGroupedSelect.vue', () => ({
  default: {
    name: 'SearchableGroupedSelect',
    template: '<div class="searchable-select-stub"></div>',
    props: ['modelValue', 'disabled', 'options'],
    emits: ['update:modelValue'],
  }
}));

describe('MemberOverrideItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useLLMProviderConfigStore();
    store.fetchProvidersWithModels = vi.fn().mockResolvedValue([]);
    store.providersWithModels = [
      {
        provider: 'Google',
        models: [
          { 
            modelIdentifier: 'gemini-1.5-pro', 
            name: 'Gemini 1.5 Pro', 
            value: 'gemini-1.5-pro', 
            canonicalName: 'gemini-1.5-pro', 
            provider: 'google', 
            runtime: 'python',
            configSchema: {
                parameters: [
                  { name: 'thinking_level', type: 'integer', description: 'Thinking Budget' }
                ]
            }
          }
        ]
      }
    ];
  });

  const defaultProps = {
    memberName: 'Member A',
    agentDefinitionId: 'def-1',
    override: undefined,
    globalLlmModel: 'gemini-1.5-pro',
    options: [],
    disabled: false,
    isCoordinator: false,
  };

  it('renders correctly', () => {
    const wrapper = mount(MemberOverrideItem, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Member A');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true); // Auto-execute checkbox
  });

  it('inherits global model schema when no override is set', async () => {
    const wrapper = mount(MemberOverrideItem, {
      props: {
        ...defaultProps,
        override: undefined,
        globalLlmModel: 'gemini-1.5-pro'
      },
    });

    await wrapper.vm.$nextTick();

    const advancedToggle = wrapper.find('[data-testid=\"advanced-params-toggle\"]');
    await advancedToggle.trigger('click');

    // Check if dynamic form from global model is visible
    expect(wrapper.text()).toContain('Model Parameters');
    expect(wrapper.text()).toContain('thinking_level');
  });

  it('uses overridden model schema when override is set', async () => {
     const store = useLLMProviderConfigStore();
     store.providersWithModels.push({
         provider: 'Anthropic',
         models: [{ 
             modelIdentifier: 'claude-3-opus', 
             name: 'Claude 3 Opus', 
             value: 'claude-3-opus', provider: 'anthropic', runtime: 'python', canonicalName: 'claude-3-opus',
             configSchema: {
                 parameters: [
                   { name: 'system_prompt_strength', type: 'string' }
                 ]
             }
         }]
     });

    const wrapper = mount(MemberOverrideItem, {
      props: {
        ...defaultProps,
        override: {
            agentDefinitionId: 'def-1',
            llmModelIdentifier: 'claude-3-opus'
        },
        globalLlmModel: 'gemini-1.5-pro'
      },
    });

    await wrapper.vm.$nextTick();

    const advancedToggle = wrapper.find('[data-testid=\"advanced-params-toggle\"]');
    await advancedToggle.trigger('click');

    expect(wrapper.text()).toContain('system_prompt_strength');
    expect(wrapper.text()).not.toContain('thinking_level');
  });

  it('emits update:override with llmConfig when dynamic input changes', async () => {
    const wrapper = mount(MemberOverrideItem, {
      props: defaultProps,
    });

    await wrapper.vm.$nextTick();
    
    const advancedToggle = wrapper.find('[data-testid=\"advanced-params-toggle\"]');
    await advancedToggle.trigger('click');

    const label = wrapper.findAll('label').find(l => l.text().includes('thinking_level'));
    const inputId = label?.attributes('for');
    const input = wrapper.find(`input[id="${inputId}"]`);
    
    await input.setValue('5');
    
    expect(wrapper.emitted('update:override')).toBeTruthy();
    const eventArgs = wrapper.emitted('update:override')![0];
    // memberName is arg 0, override is arg 1
    expect(eventArgs[0]).toBe('Member A');
    
    const emittedOverride = eventArgs[1] as any;
    expect(emittedOverride.llmConfig.thinking_level).toBe(5);
  });
});
