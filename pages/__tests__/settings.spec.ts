import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SettingsPage from '../settings.vue';

const {
  routeMock,
  serverStoreMock,
  windowNodeContextStoreMock,
} = vi.hoisted(() => ({
  routeMock: {
    query: {} as Record<string, unknown>,
  },
  serverStoreMock: {
    status: 'running',
  },
  windowNodeContextStoreMock: {
    isEmbeddedWindow: true,
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
}));

vi.mock('~/stores/serverStore', () => ({
  useServerStore: () => serverStoreMock,
}));

vi.mock('~/stores/windowNodeContextStore', () => ({
  useWindowNodeContextStore: () => windowNodeContextStoreMock,
}));

const mountSettings = () =>
  mount(SettingsPage, {
    global: {
      stubs: {
        ProviderAPIKeyManager: { template: '<div data-testid="section-api-keys" />' },
        TokenUsageStatistics: { template: '<div data-testid="section-token-usage" />' },
        ConversationHistoryManager: { template: '<div data-testid="section-conversation-logs" />' },
        NodeManager: { template: '<div data-testid="section-nodes" />' },
        ExternalMessagingManager: { template: '<div data-testid="section-external-messaging" />' },
        ServerSettingsManager: { template: '<div data-testid="section-server-settings" />' },
      },
    },
  });

describe('settings page', () => {
  beforeEach(() => {
    routeMock.query = {};
    serverStoreMock.status = 'running';
    windowNodeContextStoreMock.isEmbeddedWindow = true;
    vi.clearAllMocks();
  });

  it('shows server settings section in remote windows', () => {
    windowNodeContextStoreMock.isEmbeddedWindow = false;
    const wrapper = mountSettings();

    expect(wrapper.text()).toContain('API Keys');
    expect(wrapper.text()).toContain('Nodes');
    expect(wrapper.text()).toContain('Server Settings');
  });

  it('normalizes legacy server-status route query to server-settings in remote windows', async () => {
    windowNodeContextStoreMock.isEmbeddedWindow = false;
    routeMock.query = { section: 'server-status' };
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('server-settings');
  });

  it('defaults to server-settings when embedded server is not running', async () => {
    windowNodeContextStoreMock.isEmbeddedWindow = true;
    serverStoreMock.status = 'starting';
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('server-settings');
  });

  it('normalizes legacy server-status route query to server-settings in embedded windows', async () => {
    windowNodeContextStoreMock.isEmbeddedWindow = true;
    routeMock.query = { section: 'server-status' };
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('server-settings');
  });

  it('routes to external messaging section when requested via query', async () => {
    routeMock.query = { section: 'external-messaging' };
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('external-messaging');
  });
});
