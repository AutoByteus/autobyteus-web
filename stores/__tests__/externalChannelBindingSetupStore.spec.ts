import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { getApolloClient } from '~/utils/apolloClient';

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: vi.fn(),
}));

function createApolloMock() {
  return {
    query: vi.fn(),
    mutate: vi.fn(),
  };
}

describe('externalChannelBindingSetupStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads capabilities and sets enabled state', async () => {
    const apolloMock = createApolloMock();
    apolloMock.query.mockResolvedValue({
      data: {
        externalChannelCapabilities: {
          bindingCrudEnabled: true,
          reason: null,
          acceptedProviderTransportPairs: [
            'WHATSAPP:BUSINESS_API',
            'WHATSAPP:PERSONAL_SESSION',
            'WECOM:BUSINESS_API',
            'WECHAT:PERSONAL_SESSION',
          ],
        },
      },
      errors: [],
    });
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    const capabilities = await store.loadCapabilities();

    expect(capabilities.bindingCrudEnabled).toBe(true);
    expect(store.capabilityBlocked).toBe(false);
  });

  it('short-circuits binding load when capability disabled', async () => {
    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = false;

    const bindings = await store.loadBindingsIfEnabled();

    expect(bindings).toEqual([]);
    expect(store.bindings).toEqual([]);
  });

  it('records capability blocker on capability load failure', async () => {
    const apolloMock = createApolloMock();
    apolloMock.query.mockRejectedValue(new Error('capabilities query failed'));
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();

    await expect(store.loadCapabilities()).rejects.toThrow('capabilities query failed');

    expect(store.capabilityBlocked).toBe(true);
    expect(store.capabilities.bindingCrudEnabled).toBe(false);
    expect(store.capabilityError).toBe('capabilities query failed');
  });

  it('validates binding draft and blocks invalid upsert', async () => {
    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = true;

    await expect(
      store.upsertBinding({
        provider: 'WECOM',
        transport: 'PERSONAL_SESSION',
        accountId: '',
        peerId: '',
        threadId: null,
        targetType: 'AGENT',
        targetId: '',
        allowTransportFallback: false,
      }),
    ).rejects.toThrow('Binding validation failed');

    expect(store.fieldErrors.accountId).toBe('Account ID is required');
    expect(store.fieldErrors.transport).toContain('is not supported');
  });

  it('accepts WECHAT + PERSONAL_SESSION when server capability pair is advertised', () => {
    const store = useExternalChannelBindingSetupStore();
    store.capabilities = {
      bindingCrudEnabled: true,
      reason: null,
      acceptedProviderTransportPairs: ['WECHAT:PERSONAL_SESSION'],
    };

    const errors = store.validateDraft({
      provider: 'WECHAT',
      transport: 'PERSONAL_SESSION',
      accountId: 'wechat-account',
      peerId: 'wechat-peer',
      threadId: null,
      targetType: 'AGENT',
      targetId: 'agent-1',
      allowTransportFallback: false,
    });

    expect(errors.transport).toBeUndefined();
  });

  it('uses backward-compatible transport fallback rules when capability pairs are missing', () => {
    const store = useExternalChannelBindingSetupStore();
    store.capabilities = {
      bindingCrudEnabled: true,
      reason: null,
      acceptedProviderTransportPairs: [],
    };

    const invalidWeCom = store.validateDraft({
      provider: 'WECOM',
      transport: 'PERSONAL_SESSION',
      accountId: 'wecom-account',
      peerId: 'peer-1',
      threadId: null,
      targetType: 'AGENT',
      targetId: 'agent-1',
      allowTransportFallback: false,
    });
    const validWeChat = store.validateDraft({
      provider: 'WECHAT',
      transport: 'PERSONAL_SESSION',
      accountId: 'wechat-account',
      peerId: 'peer-1',
      threadId: null,
      targetType: 'AGENT',
      targetId: 'agent-1',
      allowTransportFallback: false,
    });

    expect(invalidWeCom.transport).toContain('is not supported');
    expect(validWeChat.transport).toBeUndefined();
  });

  it('upserts binding and updates list', async () => {
    const apolloMock = createApolloMock();
    apolloMock.mutate.mockResolvedValue({
      data: {
        upsertExternalChannelBinding: {
          id: 'binding-1',
          provider: 'WHATSAPP',
          transport: 'PERSONAL_SESSION',
          accountId: 'acc-1',
          peerId: 'peer-1',
          threadId: null,
          targetType: 'AGENT',
          targetId: 'agent-1',
          allowTransportFallback: true,
          updatedAt: '2026-02-09T10:00:00.000Z',
        },
      },
      errors: [],
    });
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = true;

    const binding = await store.upsertBinding({
      provider: 'WHATSAPP',
      transport: 'PERSONAL_SESSION',
      accountId: 'acc-1',
      peerId: 'peer-1',
      threadId: null,
      targetType: 'AGENT',
      targetId: 'agent-1',
      allowTransportFallback: true,
    });

    expect(binding.id).toBe('binding-1');
    expect(store.bindings).toHaveLength(1);
  });

  it('re-checks capabilities before upsert when capability is stale-disabled', async () => {
    const apolloMock = createApolloMock();
    apolloMock.query.mockResolvedValue({
      data: {
        externalChannelCapabilities: {
          bindingCrudEnabled: true,
          reason: null,
          acceptedProviderTransportPairs: ['WHATSAPP:PERSONAL_SESSION'],
        },
      },
      errors: [],
    });
    apolloMock.mutate.mockResolvedValue({
      data: {
        upsertExternalChannelBinding: {
          id: 'binding-2',
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
      },
      errors: [],
    });
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = false;
    store.capabilities.reason = 'stale disabled';

    const binding = await store.upsertBinding({
      provider: 'WHATSAPP',
      transport: 'PERSONAL_SESSION',
      accountId: 'acc-1',
      peerId: 'peer-1',
      threadId: null,
      targetType: 'AGENT',
      targetId: 'agent-1',
      allowTransportFallback: false,
    });

    expect(binding.id).toBe('binding-2');
    expect(apolloMock.query).toHaveBeenCalled();
    expect(apolloMock.mutate).toHaveBeenCalled();
    expect(store.capabilities.bindingCrudEnabled).toBe(true);
  });

  it('uses capability reason when server still reports binding disabled', async () => {
    const apolloMock = createApolloMock();
    apolloMock.query.mockResolvedValue({
      data: {
        externalChannelCapabilities: {
          bindingCrudEnabled: false,
          reason: 'Binding API rollout not enabled',
          acceptedProviderTransportPairs: [],
        },
      },
      errors: [],
    });
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = false;

    await expect(
      store.upsertBinding({
        provider: 'WHATSAPP',
        transport: 'PERSONAL_SESSION',
        accountId: 'acc-1',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: false,
      }),
    ).rejects.toThrow('Binding API rollout not enabled');

    expect(store.error).toBe('Binding API rollout not enabled');
    expect(apolloMock.mutate).not.toHaveBeenCalled();
  });

  it('marks capability blocked on schema mismatch during mutation', async () => {
    const apolloMock = createApolloMock();
    apolloMock.mutate.mockRejectedValue(
      new Error('Cannot query field "upsertExternalChannelBinding" on type "Mutation"'),
    );
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = true;

    await expect(
      store.upsertBinding({
        provider: 'WHATSAPP',
        transport: 'PERSONAL_SESSION',
        accountId: 'acc-1',
        peerId: 'peer-1',
        threadId: null,
        targetType: 'AGENT',
        targetId: 'agent-1',
        allowTransportFallback: true,
      }),
    ).rejects.toThrow('Cannot query field');

    expect(store.capabilityBlocked).toBe(true);
    expect(store.rolloutGateError).toContain('Cannot query field');
    expect(store.capabilities.bindingCrudEnabled).toBe(false);
  });

  it('deletes binding from list', async () => {
    const apolloMock = createApolloMock();
    apolloMock.mutate.mockResolvedValue({
      data: {
        deleteExternalChannelBinding: true,
      },
      errors: [],
    });
    vi.mocked(getApolloClient).mockReturnValue(apolloMock as any);

    const store = useExternalChannelBindingSetupStore();
    store.capabilities.bindingCrudEnabled = true;
    store.bindings = [
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
        updatedAt: '2026-02-09T11:00:00.000Z',
      },
    ];

    await store.deleteBinding('binding-1');

    expect(store.bindings).toEqual([]);
  });
});
