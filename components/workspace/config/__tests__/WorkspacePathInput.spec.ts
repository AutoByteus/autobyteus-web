import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WorkspacePathInput from '../WorkspacePathInput.vue';

describe('WorkspacePathInput', () => {
  it('renders input with model value', async () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '/tmp/test',
        isLoading: false,
        error: null,
        isLoaded: false,
      },
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('/tmp/test');
  });

  it('emits update:modelValue on input when enter is pressed', async () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '',
        isLoading: false,
        error: null,
        isLoaded: false,
      },
    });

    const input = wrapper.find('input');
    await input.setValue('/new/path');
    await input.trigger('keydown.enter');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['/new/path']);
  });

  it('shows loading indicator when isLoading is true', () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '/tmp/test',
        isLoading: true,
        error: null,
        isLoaded: false,
      },
    });

    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('shows error message when error is present', () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '/tmp/test',
        isLoading: false,
        error: 'Path not found',
        isLoaded: false,
      },
    });

    expect(wrapper.text()).toContain('Path not found');
    expect(wrapper.find('.text-red-600').exists()).toBe(true);
  });

  it('shows success indicator when isLoaded is true', () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '/tmp/test',
        isLoading: false,
        error: null,
        isLoaded: true,
      },
    });

    // Expect checkmark icon (heroicons-check or similar)
    expect(wrapper.find('.i-heroicons-check-circle-20-solid').exists()).toBe(true);
  });

  it('disables input when inputDisabled is true', () => {
    const wrapper = mount(WorkspacePathInput, {
      props: {
        modelValue: '/tmp/test',
        isLoading: false,
        error: null,
        isLoaded: false,
        disabled: true,
      },
    });

    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
  });
});
