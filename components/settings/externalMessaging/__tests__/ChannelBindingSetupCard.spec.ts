import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ChannelBindingSetupCard from '../ChannelBindingSetupCard.vue';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { useExternalChannelBindingOptionsStore } from '~/stores/externalChannelBindingOptionsStore';
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';

describe('ChannelBindingSetupCard', () => {
  let pinia: ReturnType<typeof createPinia>;

  const mountWithPinia = () =>
    mount(ChannelBindingSetupCard, {
      global: {
        plugins: [pinia],
      },
    });

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('disables peer refresh until gateway connection and personal session are both ready', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = {
      sessionId: 'session-1',
      accountLabel: 'Home WhatsApp',
      status: 'PENDING_QR',
    };

    const wrapper = mountWithPinia();
    await flushPromises();

    const refreshButton = wrapper.get('[data-testid="refresh-peer-candidates-button"]');
    expect(refreshButton.attributes('disabled')).toBeDefined();
  });

  it('refreshes peer candidates when readiness prerequisites are satisfied', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = {
      sessionId: 'session-2',
      accountLabel: 'Home WhatsApp',
      status: 'ACTIVE',
    };

    const optionsStore = useExternalChannelBindingOptionsStore();
    const loadPeerCandidatesSpy = vi
      .spyOn(optionsStore, 'loadPeerCandidates')
      .mockResolvedValue([]);

    const wrapper = mountWithPinia();
    await flushPromises();

    const refreshButton = wrapper.get('[data-testid="refresh-peer-candidates-button"]');
    expect(refreshButton.attributes('disabled')).toBeUndefined();

    await refreshButton.trigger('click');
    await flushPromises();

    expect(loadPeerCandidatesSpy).toHaveBeenCalledWith(
      'session-2',
      { includeGroups: true, limit: 50 },
      'WHATSAPP',
    );
  });

  it('hides transport fallback toggle in setup UI', async () => {
    const optionsStore = useExternalChannelBindingOptionsStore();
    optionsStore.peerCandidates = [
      {
        peerId: 'peer-1',
        peerType: 'USER',
        threadId: null,
        displayName: 'Peer One',
        lastMessageAt: '2026-02-09T12:00:00.000Z',
      },
    ];
    optionsStore.targetOptions = [
      {
        targetType: 'AGENT',
        targetId: 'agent-1',
        displayName: 'Agent One',
        status: 'RUNNING',
      },
    ];

    const wrapper = mountWithPinia();
    await flushPromises();

    expect(wrapper.find('[data-testid="binding-allow-fallback"]').exists()).toBe(false);
  });

  it('shows Discord identity guidance and applies capability account default', async () => {
    const providerScopeStore = useExternalMessagingProviderScopeStore();

    providerScopeStore.initialize({
      wechatModes: [],
      defaultWeChatMode: null,
      wechatPersonalEnabled: false,
      wecomAppEnabled: false,
      discordEnabled: true,
      discordAccountId: 'discord-acct-1',
    });
    providerScopeStore.setSelectedProvider('DISCORD');

    const wrapper = mountWithPinia();
    await flushPromises();

    expect(wrapper.find('[data-testid="discord-identity-hint"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Account ID should be');
    expect(wrapper.text()).toContain('discord-acct-1');
  });

  it('renders threadId field errors from binding store', async () => {
    const bindingStore = useExternalChannelBindingSetupStore();
    bindingStore.fieldErrors.threadId = 'Thread ID is invalid';

    const wrapper = mountWithPinia();
    await flushPromises();

    expect(wrapper.text()).toContain('Thread ID is invalid');
  });

  it('refreshes Discord peer candidates without personal session prerequisite', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = null;

    const providerScopeStore = useExternalMessagingProviderScopeStore();
    providerScopeStore.initialize({
      wechatModes: [],
      defaultWeChatMode: null,
      wechatPersonalEnabled: false,
      wecomAppEnabled: false,
      discordEnabled: true,
      discordAccountId: 'discord-acct-1',
    });
    providerScopeStore.setSelectedProvider('DISCORD');

    const optionsStore = useExternalChannelBindingOptionsStore();
    const loadPeerCandidatesSpy = vi
      .spyOn(optionsStore, 'loadPeerCandidates')
      .mockResolvedValue([]);

    const wrapper = mountWithPinia();
    await flushPromises();

    const refreshButton = wrapper.get('[data-testid="refresh-peer-candidates-button"]');
    expect(refreshButton.attributes('disabled')).toBeUndefined();

    await refreshButton.trigger('click');
    await flushPromises();

    expect(loadPeerCandidatesSpy).toHaveBeenCalledWith(
      'discord-acct-1',
      { includeGroups: true, limit: 50 },
      'DISCORD',
    );
  });
});
