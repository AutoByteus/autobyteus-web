import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ExternalMessagingManager from '../ExternalMessagingManager.vue';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { useExternalChannelBindingOptionsStore } from '~/stores/externalChannelBindingOptionsStore';
import { useGatewayCapabilityStore } from '~/stores/gatewayCapabilityStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';

describe('ExternalMessagingManager', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('bootstraps setup stores on mount', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const capabilityStore = useGatewayCapabilityStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const optionsStore = useExternalChannelBindingOptionsStore();

    const initSpy = vi.spyOn(gatewayStore, 'initializeFromConfig').mockImplementation(() => {});
    const loadGatewayCapabilitiesSpy = vi.spyOn(capabilityStore, 'loadCapabilities').mockResolvedValue({
      wechatModes: ['WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'WECOM_APP_BRIDGE',
      wecomAppEnabled: true,
      wechatPersonalEnabled: false,
      discordEnabled: false,
      discordAccountId: null,
    });
    const loadWeComAccountsSpy = vi.spyOn(capabilityStore, 'loadWeComAccounts').mockResolvedValue([]);
    const loadCapabilitiesSpy = vi
      .spyOn(bindingStore, 'loadCapabilities')
      .mockResolvedValue({ bindingCrudEnabled: true, reason: undefined });
    const loadBindingsSpy = vi.spyOn(bindingStore, 'loadBindingsIfEnabled').mockResolvedValue([]);
    const loadTargetOptionsSpy = vi.spyOn(optionsStore, 'loadTargetOptions').mockResolvedValue([]);

    mount(ExternalMessagingManager, {
      global: {
        plugins: [pinia],
      },
    });
    await flushPromises();

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(loadGatewayCapabilitiesSpy).toHaveBeenCalledTimes(1);
    expect(loadWeComAccountsSpy).toHaveBeenCalledTimes(1);
    expect(loadCapabilitiesSpy).toHaveBeenCalledTimes(1);
    expect(loadBindingsSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetOptionsSpy).toHaveBeenCalledTimes(1);
  });

  it('stops session auto sync on unmount', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const capabilityStore = useGatewayCapabilityStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const optionsStore = useExternalChannelBindingOptionsStore();

    vi.spyOn(gatewayStore, 'initializeFromConfig').mockImplementation(() => {});
    vi.spyOn(capabilityStore, 'loadCapabilities').mockResolvedValue({
      wechatModes: ['WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'WECOM_APP_BRIDGE',
      wecomAppEnabled: true,
      wechatPersonalEnabled: false,
      discordEnabled: false,
      discordAccountId: null,
    });
    vi.spyOn(capabilityStore, 'loadWeComAccounts').mockResolvedValue([]);
    vi.spyOn(bindingStore, 'loadCapabilities').mockResolvedValue({
      bindingCrudEnabled: true,
      reason: undefined,
    });
    vi.spyOn(bindingStore, 'loadBindingsIfEnabled').mockResolvedValue([]);
    vi.spyOn(optionsStore, 'loadTargetOptions').mockResolvedValue([]);
    const stopSyncSpy = vi
      .spyOn(gatewayStore, 'stopSessionStatusAutoSync')
      .mockImplementation(() => {});

    const wrapper = mount(ExternalMessagingManager, {
      global: {
        plugins: [pinia],
      },
    });
    await flushPromises();

    wrapper.unmount();
    expect(stopSyncSpy).toHaveBeenCalledWith('view_unmounted');
  });
});
