import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';

describe('externalMessagingProviderScopeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes available providers from gateway capabilities', () => {
    const store = useExternalMessagingProviderScopeStore();

    store.initialize({
      wechatModes: ['DIRECT_PERSONAL_SESSION', 'WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'DIRECT_PERSONAL_SESSION',
      wechatPersonalEnabled: true,
      wecomAppEnabled: true,
    });

    expect(store.availableProviders).toEqual(['WHATSAPP', 'WECHAT', 'WECOM']);
    expect(store.options.map((entry) => entry.provider)).toEqual([
      'WHATSAPP',
      'WECHAT',
      'WECOM',
    ]);
    expect(store.initialized).toBe(true);
  });

  it('falls back to first available provider when current selection is no longer available', () => {
    const store = useExternalMessagingProviderScopeStore();

    store.initialize({
      wechatModes: ['DIRECT_PERSONAL_SESSION'],
      defaultWeChatMode: 'DIRECT_PERSONAL_SESSION',
      wechatPersonalEnabled: true,
      wecomAppEnabled: false,
    });
    store.setSelectedProvider('WECHAT');

    store.initialize({
      wechatModes: ['WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'WECOM_APP_BRIDGE',
      wechatPersonalEnabled: false,
      wecomAppEnabled: false,
    });

    expect(store.selectedProvider).toBe('WHATSAPP');
  });

  it('resolves transport and personal-session requirement based on provider', () => {
    const store = useExternalMessagingProviderScopeStore();

    store.initialize({
      wechatModes: ['WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'WECOM_APP_BRIDGE',
      wechatPersonalEnabled: false,
      wecomAppEnabled: true,
    });
    store.setSelectedProvider('WECOM');

    expect(store.requiresPersonalSession).toBe(false);
    expect(store.resolvedTransport).toBe('BUSINESS_API');
  });
});
