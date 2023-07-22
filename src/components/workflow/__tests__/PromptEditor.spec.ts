// src/components/workflow/__tests__/PromptEditor.spec.ts

import { mount } from '@vue/test-utils';
import PromptEditor from '../PromptEditor.vue';
import { describe, it, expect } from 'vitest'

it("testing GuessAge component props", async () => {
  console.log("How to debug this");
});


describe('PromptEditor.vue', () => {
  it('renders the entire prompt from the template prop', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello, {name}!'
      }
    });
    const textarea = wrapper.find('.entire-prompt-editor');
    expect(textarea.element.value).toBe('Hello, {name}!');
  });

  it('renders placeholders', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello, {name}! Age: {age}'
      }
    });
    const placeholders = wrapper.findAll('.segment-input');
    expect(placeholders.length).toBe(2);
  });

  it('binds placeholder values', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello, {name}!'
      }
    });
    const textarea = wrapper.find('#name');
    await textarea.setValue('John');
    expect(wrapper.vm.values.name).toBe('John');
  });

  it('resizes textarea on input', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello, {name}!'
      }
    });
    const textarea = wrapper.find('.entire-prompt-editor');
    await textarea.setValue('Hello, John!\nHow are you today?');
    await textarea.trigger('input');
    expect(textarea.element.style.height).toBeGreaterThan('0px');
  });

  it('resizes all textareas on component mount', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello, {name}!\nAge: {age}'
      }
    });
    await nextTick();
    const textareas = wrapper.findAll('textarea');
    for (let i = 0; i < textareas.length; i++) {
      expect(textareas[i].element.style.height).toBeGreaterThan('0px');
    }
  });
});

