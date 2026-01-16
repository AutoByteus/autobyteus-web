import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorkspaceSelector from '../WorkspaceSelector.vue';
import { useWorkspaceStore } from '~/stores/workspace';
import { useServerStore } from '~/stores/serverStore';

// Mock the SearchableSelect component
vi.mock('~/components/common/SearchableSelect.vue', () => ({
  default: {
    name: 'SearchableSelect',
    template: '<div class="searchable-select-stub"></div>',
    props: ['modelValue', 'options', 'disabled', 'placeholder'],
    emits: ['update:model-value'],
  }
}));

describe('WorkspaceSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Mock the fetchAllWorkspaces action
    const workspaceStore = useWorkspaceStore();
    workspaceStore.fetchAllWorkspaces = vi.fn().mockResolvedValue([]);
    
    // Reset window.electronAPI mock
    delete (window as any).electronAPI;
  });

  const defaultProps = {
    workspaceId: null,
    isLoading: false,
    error: null,
    disabled: false,
  };

  it('renders with New tab selected by default when no workspaces exist', async () => {
    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    // Should show the path input (New mode) when no workspaces exist
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="/absolute/path/to/workspace"]').exists()).toBe(true);
  });

  it('hides Browse button when not in Electron environment', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = false;

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    // Browse button should not be visible
    const browseButton = wrapper.find('button[title="Browse for folder"]');
    expect(browseButton.exists()).toBe(false);
  });

  it('shows Browse button when in Electron environment', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    // Browse button should be visible
    const browseButton = wrapper.find('button[title="Browse for folder"]');
    expect(browseButton.exists()).toBe(true);
  });

  it('calls showFolderDialog when Browse button is clicked', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const mockShowFolderDialog = vi.fn().mockResolvedValue({
      canceled: false,
      path: '/selected/folder/path',
    });
    
    (window as any).electronAPI = {
      showFolderDialog: mockShowFolderDialog,
    };

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    const browseButton = wrapper.find('button[title="Browse for folder"]');
    await browseButton.trigger('click');
    await wrapper.vm.$nextTick();

    expect(mockShowFolderDialog).toHaveBeenCalled();
    
    // Path should be populated
    const input = wrapper.find('input[type="text"]');
    expect((input.element as HTMLInputElement).value).toBe('/selected/folder/path');
  });

  it('does not update path when dialog is canceled', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const mockShowFolderDialog = vi.fn().mockResolvedValue({
      canceled: true,
      path: null,
    });
    
    (window as any).electronAPI = {
      showFolderDialog: mockShowFolderDialog,
    };

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    // Set initial value
    const input = wrapper.find('input[type="text"]');
    await input.setValue('/initial/path');

    const browseButton = wrapper.find('button[title="Browse for folder"]');
    await browseButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Path should remain unchanged
    expect((input.element as HTMLInputElement).value).toBe('/initial/path');
  });

  it('emits load-new when Load button is clicked with path', async () => {
    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    const input = wrapper.find('input[type="text"]');
    await input.setValue('/test/workspace/path');

    // Find Load button by title attribute (now uses icon instead of text)
    const loadButton = wrapper.find('button[title="Load workspace"]');
    await loadButton.trigger('click');

    expect(wrapper.emitted('load-new')).toBeTruthy();
    expect(wrapper.emitted('load-new')![0]).toEqual(['/test/workspace/path']);
  });

  it('disables Browse button when isLoading is true', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const wrapper = mount(WorkspaceSelector, {
      props: { ...defaultProps, isLoading: true },
    });
    await wrapper.vm.$nextTick();

    const browseButton = wrapper.find('button[title="Browse for folder"]');
    expect(browseButton.attributes('disabled')).toBeDefined();
  });

  it('disables Browse button when disabled prop is true', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const wrapper = mount(WorkspaceSelector, {
      props: { ...defaultProps, disabled: true },
    });
    await wrapper.vm.$nextTick();

    const browseButton = wrapper.find('button[title="Browse for folder"]');
    expect(browseButton.attributes('disabled')).toBeDefined();
  });

  it('shows helper text for Electron mode', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = true;

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Browse for a folder or enter path manually.');
  });

  it('shows helper text for browser mode', async () => {
    const serverStore = useServerStore();
    (serverStore as any).isElectron = false;

    const wrapper = mount(WorkspaceSelector, {
      props: defaultProps,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Enter path to load a new workspace.');
  });
});
