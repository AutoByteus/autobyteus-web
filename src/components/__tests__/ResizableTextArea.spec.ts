import { mount } from '@vue/test-utils';
import ResizableTextArea from '../ResizableTextArea.vue';
import { describe, it, expect } from 'vitest';

describe('ResizableTextArea.vue', () => {

  // Test case 1: Ensure that the component initially renders the `modelValue` prop.
  it('renders the provided modelValue prop on mount', () => {
    const wrapper = mount(ResizableTextArea, {
      props: {
        modelValue: 'Initial text content'
      }
    });
    const textarea = wrapper.find('.resizable-textarea');
    expect(textarea.element.value).toBe('Initial text content');
  });

  // Test case 2: Check if the component emits the correct updated value when the textarea's content is changed.
  it('emits the correct value on input', async () => {
    const wrapper = mount(ResizableTextArea);
    const textarea = wrapper.find('.resizable-textarea');
    
    await textarea.setValue('New text content');
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['New text content']);
  });

  // Test case 3: Check if the textarea resizes correctly after input.
  // Note: This test is a bit tricky because the resize logic is based on the scrollHeight of the textarea.
  // In a real browser, the scrollHeight would change based on content, but in a testing environment,
  // we might not see this behavior. Thus, this test will be more of a sanity check to see if the method is called.
  it('resizes the textarea on input', async () => {
    const wrapper = mount(ResizableTextArea, {
      props: {
        modelValue: 'Initial text content'
      }
    });
    const textarea = wrapper.find('.resizable-textarea');

    const initialHeight = textarea.element.style.height;

    await textarea.setValue('New text content. New text content. New text content. New text content.');
    const newHeight = textarea.element.style.height;

    expect(initialHeight).not.toBe(newHeight);
  });

});
