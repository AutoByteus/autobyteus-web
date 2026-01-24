import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ModelConfigSection from '../ModelConfigSection.vue';

// Mock the store
vi.mock('~/stores/llmProviderConfig', () => ({
  useLlmProviderConfigStore: vi.fn(() => ({
    providersWithModels: [
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: [
          {
            id: 'claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            config_schema: {
              properties: {
                thinking_enabled: { type: 'boolean', title: 'Thinking Enabled', default: true },
                thinking_level: { type: 'integer', title: 'Thinking Level', default: 5 }
              }
            }
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            config_schema: {
              properties: {
                temperature: { type: 'number', title: 'Temperature', default: 0.7 }
              }
            }
          }
        ]
      }
    ],
    getProviderForModel: (modelId: string) => {
      if (modelId.startsWith('claude')) return { id: 'anthropic' };
      if (modelId.startsWith('gpt')) return { id: 'openai' };
      return null;
    },
    getModel: (modelId: string) => {
      if (modelId === 'claude-3-5-sonnet') return {
        id: 'claude-3-5-sonnet',
        config_schema: {
          properties: {
            thinking_enabled: { type: 'boolean', title: 'Thinking Enabled', default: true },
            thinking_level: { type: 'integer', title: 'Thinking Level', default: 5 }
          }
        }
      };
      if (modelId === 'gpt-4') return {
        id: 'gpt-4',
        config_schema: {
          properties: {
            temperature: { type: 'number', title: 'Temperature', default: 0.7 }
          }
        }
      };
      return null;
    }
  }))
}));

describe('ModelConfigSection', () => {
  it('resets configuration when schema changes', async () => {
    const wrapper = mount(ModelConfigSection, {
      props: {
        modelId: 'claude-3-5-sonnet',
        modelConfig: { thinking_enabled: true, thinking_level: 5 },
        schema: {
          properties: {
            thinking_enabled: { type: 'boolean', title: 'Thinking Enabled', default: true },
            thinking_level: { type: 'integer', title: 'Thinking Level', default: 5 }
          }
        }
      }
    });

    // Initial state check
    expect(wrapper.props('modelConfig')).toEqual({ thinking_enabled: true, thinking_level: 5 });

    // Change schema (simulate model switch)
    await wrapper.setProps({
      modelId: 'gpt-4',
      schema: {
        properties: {
          temperature: { type: 'number', title: 'Temperature', default: 0.7 }
        }
      }
    });

    // Expect emit(null) to be called because we kept the same config object (simulating model switch)
    expect(wrapper.emitted('update:config')).toBeTruthy();
    expect(wrapper.emitted('update:config')!.some(args => args[0] === null)).toBe(true);
  });

  it('does NOT reset configuration when switching agents (context switch)', async () => {
    const configA = { thinking_enabled: true };
    const configB = { temperature: 0.5 };
    
    const wrapper = mount(ModelConfigSection, {
      props: {
        modelId: 'claude',
        modelConfig: configA, 
        schema: {
          properties: { thinking_enabled: { type: 'boolean', default: true } }
        }
      }
    });

    // Switch "Agent" -> New Schema AND New Config Object
    await wrapper.setProps({
      modelId: 'gpt',
      modelConfig: configB, // Different object ref
      schema: {
        properties: { temperature: { type: 'number', default: 0.7 } }
      }
    });

    // Should NOT emit null (Agent B's config should be preserved)
    // It usually emits defaults for the new schema, but specifically NOT null
    const updates = wrapper.emitted('update:config') || [];
    const hasNullReset = updates.some(args => args[0] === null);
    expect(hasNullReset).toBe(false);
  });


  it('does not reset configuration when schema is identical', async () => {
    const schema = {
      properties: {
        thinking_enabled: { type: 'boolean', title: 'Thinking Enabled', default: true }
      }
    };

    const wrapper = mount(ModelConfigSection, {
      props: {
        modelId: 'claude-3-5-sonnet',
        modelConfig: { thinking_enabled: true },
        schema: schema
      }
    });

    // Update with identical schema
    await wrapper.setProps({
      schema: { ...schema } // New object, same content
    });

    // Should NOT emit null
    const emits = wrapper.emitted('update:modelConfig');
    if (emits) {
        expect(emits.some(args => args[0] === null)).toBe(false);
    } else {
        expect(emits).toBeUndefined();
    }
  });
});
