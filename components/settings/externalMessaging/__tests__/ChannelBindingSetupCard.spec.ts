import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ChannelBindingSetupCard from '../ChannelBindingSetupCard.vue';
import { useExternalChannelBindingOptionsStore } from '~/stores/externalChannelBindingOptionsStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';

describe('ChannelBindingSetupCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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

    const wrapper = mount(ChannelBindingSetupCard);
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

    const wrapper = mount(ChannelBindingSetupCard);
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

    const wrapper = mount(ChannelBindingSetupCard);
    await flushPromises();

    expect(wrapper.find('[data-testid="binding-allow-fallback"]').exists()).toBe(false);
  });
});
