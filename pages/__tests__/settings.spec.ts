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
        ServerSettingsManager: { template: '<div data-testid="section-server-settings" />' },
        ServerMonitor: { template: '<div data-testid="section-server-status" />' },
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

  it('hides embedded-only server sections in remote windows', () => {
    windowNodeContextStoreMock.isEmbeddedWindow = false;
    const wrapper = mountSettings();

    expect(wrapper.text()).toContain('API Keys');
    expect(wrapper.text()).toContain('Nodes');
    expect(wrapper.text()).not.toContain('Server Settings');
    expect(wrapper.text()).not.toContain('Server Status');
  });

  it('falls back to API keys when a remote window is routed to server-status section', async () => {
    windowNodeContextStoreMock.isEmbeddedWindow = false;
    routeMock.query = { section: 'server-status' };
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('api-keys');
  });

  it('defaults to server-status when embedded server is not running', async () => {
    windowNodeContextStoreMock.isEmbeddedWindow = true;
    serverStoreMock.status = 'starting';
    const wrapper = mountSettings();
    await nextTick();
    const setupState = (wrapper.vm as any).$?.setupState;

    expect(setupState.activeSection).toBe('server-status');
  });
});
