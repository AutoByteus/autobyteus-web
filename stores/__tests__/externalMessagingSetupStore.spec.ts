import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';
import { useExternalMessagingSetupStore } from '~/stores/externalMessagingSetupStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';

describe('externalMessagingSetupStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('stepStates returns READY states when prerequisites are ready', () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const setupStore = useExternalMessagingSetupStore();

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = {
      sessionId: 'session-1',
      accountLabel: 'Home',
      status: 'ACTIVE',
    };

    bindingStore.capabilities.bindingCrudEnabled = true;
    bindingStore.bindings = [
      {
        id: 'binding-1',
        provider: 'WHATSAPP',
        transport: 'PERSONAL_SESSION',
        accountId: 'acc-1',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: false,
        updatedAt: '2026-02-09T12:00:00.000Z',
      },
    ];

    const steps = setupStore.stepStates;

    expect(steps.find((step) => step.key === 'gateway')?.status).toBe('READY');
    expect(steps.find((step) => step.key === 'personal_session')?.status).toBe('READY');
    expect(steps.find((step) => step.key === 'binding')?.status).toBe('READY');
  });

  it('stepStates keeps personal_session as PENDING before any session is started', () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const setupStore = useExternalMessagingSetupStore();

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = null;
    gatewayStore.personalModeBlockedReason = null;
    bindingStore.capabilities.bindingCrudEnabled = true;
    bindingStore.bindings = [];

    const steps = setupStore.stepStates;
    const personalStep = steps.find((step) => step.key === 'personal_session');

    expect(personalStep?.status).toBe('PENDING');
    expect(personalStep?.detail).toBeUndefined();
  });

  it('runSetupVerification returns ready=true when all prerequisites pass', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const setupStore = useExternalMessagingSetupStore();

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = {
      sessionId: 'session-1',
      accountLabel: 'Home',
      status: 'ACTIVE',
    };
    bindingStore.capabilities.bindingCrudEnabled = true;
    bindingStore.bindings = [
      {
        id: 'binding-1',
        provider: 'WHATSAPP',
        transport: 'PERSONAL_SESSION',
        accountId: 'acc-1',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: false,
        updatedAt: '2026-02-09T12:00:00.000Z',
      },
    ];

    const result = await setupStore.runSetupVerification();

    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it('runSetupVerification reports binding capability blocker when disabled', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const setupStore = useExternalMessagingSetupStore();

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = {
      sessionId: 'session-1',
      accountLabel: 'Home',
      status: 'ACTIVE',
    };

    bindingStore.capabilities.bindingCrudEnabled = false;
    bindingStore.capabilities.reason = 'Binding API unavailable';

    const result = await setupStore.runSetupVerification();

    expect(result.ready).toBe(false);
    expect(result.blockers.some((item) => item.code === 'SERVER_BINDING_API_UNAVAILABLE')).toBe(true);
  });

  it('runSetupVerification reports session blocker when personal session not active', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const setupStore = useExternalMessagingSetupStore();

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = null;
    bindingStore.capabilities.bindingCrudEnabled = true;
    bindingStore.bindings = [
      {
        id: 'binding-1',
        provider: 'WHATSAPP',
        transport: 'PERSONAL_SESSION',
        accountId: 'acc-1',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: false,
        updatedAt: '2026-02-09T12:00:00.000Z',
      },
    ];

    const result = await setupStore.runSetupVerification();

    expect(result.ready).toBe(false);
    expect(result.blockers.some((item) => item.code === 'SESSION_NOT_READY')).toBe(true);
  });

  it('treats personal session as not required for WECOM scope', async () => {
    const gatewayStore = useGatewaySessionSetupStore();
    const bindingStore = useExternalChannelBindingSetupStore();
    const providerScopeStore = useExternalMessagingProviderScopeStore();
    const setupStore = useExternalMessagingSetupStore();

    providerScopeStore.initialize({
      wechatModes: ['WECOM_APP_BRIDGE'],
      defaultWeChatMode: 'WECOM_APP_BRIDGE',
      wechatPersonalEnabled: false,
      wecomAppEnabled: true,
    });
    providerScopeStore.setSelectedProvider('WECOM');

    gatewayStore.gatewayStatus = 'READY';
    gatewayStore.session = null;
    bindingStore.capabilities.bindingCrudEnabled = true;
    bindingStore.bindings = [
      {
        id: 'binding-1',
        provider: 'WECOM',
        transport: 'BUSINESS_API',
        accountId: 'wecom-account',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: false,
        updatedAt: '2026-02-09T12:00:00.000Z',
      },
    ];

    const steps = setupStore.stepStates;
    expect(steps.find((step) => step.key === 'personal_session')?.status).toBe('READY');

    const result = await setupStore.runSetupVerification();
    expect(result.ready).toBe(true);
    expect(result.blockers.some((item) => item.code === 'SESSION_NOT_READY')).toBe(false);
  });
});
