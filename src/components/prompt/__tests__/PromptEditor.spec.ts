// src/components/workflow/__tests__/PromptEditor.spec.ts

import { mount } from '@vue/test-utils';
import PromptEditor from '../PromptEditor.vue';
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';

describe('PromptEditor.vue', () => {
  it('renders the entire prompt from the template prop', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}!',
          variables: []
        }
      }
    });
    const textarea = wrapper.find('.entire-prompt-editor');
    expect(textarea.element.value).toBe('Hello, {name}!');
  });

  it('renders placeholders with correct labels', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}! Age: {age}',
          variables: [
            { name: 'name', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false },
            { name: 'age', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false }
          ]
        }
      }
    });
    const placeholders = wrapper.findAll('.placeholder-input');
    const labels = wrapper.findAll('label');
    expect(placeholders.length).toBe(2);
    expect(labels[0].text()).toBe('name');
    expect(labels[1].text()).toBe('age');
  });

  it('binds placeholder values', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}!',
          variables: [
            { name: 'name', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false }
          ]
        }
      }
    });
    const textarea = wrapper.find('.placeholder-input');
    await textarea.setValue('John');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('John');
  });

  it('emits update:variable event when textarea value changes', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}!',
          variables: [
            { name: 'name', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false }
          ]
        }
      }
    });
    const textarea = wrapper.find('.placeholder-input');
    await textarea.setValue('John');
    expect(wrapper.emitted()['update:variable']).toBeTruthy();
    expect(wrapper.emitted()['update:variable'][0]).toEqual([{ variableName: 'name', value: 'John' }]);
  });

  // ... (Rest of the tests remain unchanged)

  it('resizes textarea on input', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}!',
          variables: []
        }
      }
    });
    const textarea = wrapper.find('.entire-prompt-editor');
    await textarea.setValue('Hello, John!\nHow are you today?');
    await textarea.trigger('input');
    expect(parseInt(textarea.element.style.height)).toBeGreaterThan(1);
  });

  it('resizes all textareas on component mount', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: {
          template: 'Hello, {name}!\nAge: {age}',
          variables: [
            { name: 'name', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false },
            { name: 'age', source: 'USER_INPUT', allow_code_context_building: false, allow_llm_refinement: false }
          ]
        }
      }
    });
    await nextTick();
    const textareas = wrapper.findAll('textarea');
    for (let i = 0; i < textareas.length; i++) {
      const height = parseInt(textareas[i].element.style.height);  // Parse the height value
      expect(height).toBeGreaterThan(1);
    }
  });
});
