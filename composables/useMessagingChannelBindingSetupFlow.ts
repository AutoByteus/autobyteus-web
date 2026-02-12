import { computed, reactive, ref, watch } from 'vue';
import { useMessagingChannelBindingSetupStore } from '~/stores/messagingChannelBindingSetupStore';
import {
  buildPeerCandidateKey,
  useMessagingChannelBindingOptionsStore,
} from '~/stores/messagingChannelBindingOptionsStore';
import { useMessagingProviderScopeStore } from '~/stores/messagingProviderScopeStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';
import type {
  ExternalChannelBindingDraft,
  ExternalChannelBindingTargetOption,
  GatewayPeerCandidate,
} from '~/types/messaging';

function normalizeAccountId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function useMessagingChannelBindingSetupFlow() {
  const bindingStore = useMessagingChannelBindingSetupStore();
  const optionsStore = useMessagingChannelBindingOptionsStore();
  const providerScopeStore = useMessagingProviderScopeStore();
  const gatewayStore = useGatewaySessionSetupStore();

  const useManualPeerInput = ref(false);
  const useManualTargetInput = ref(false);
  const selectedPeerKey = ref('');
  const selectedTargetId = ref('');

  const draft = reactive<ExternalChannelBindingDraft>({
    provider: providerScopeStore.selectedProvider,
    transport: providerScopeStore.resolvedTransport,
    accountId:
      providerScopeStore.selectedProvider === 'DISCORD'
        ? providerScopeStore.discordAccountId || ''
        : '',
    peerId: '',
    threadId: null,
    targetType: 'AGENT',
    targetId: '',
    allowTransportFallback: false,
  });

  const filteredTargetOptions = computed<ExternalChannelBindingTargetOption[]>(() =>
    optionsStore.targetOptionsByType(draft.targetType),
  );

  const supportsPeerDiscovery = computed(() => {
    if (draft.provider === 'DISCORD' && draft.transport === 'BUSINESS_API') {
      return true;
    }
    return (
      providerScopeStore.requiresPersonalSession &&
      draft.transport === 'PERSONAL_SESSION' &&
      (draft.provider === 'WHATSAPP' || draft.provider === 'WECHAT')
    );
  });

  const effectiveManualPeerInput = computed(
    () => !supportsPeerDiscovery.value || useManualPeerInput.value,
  );

  const canDiscoverPeers = computed(() => {
    if (!supportsPeerDiscovery.value || !gatewayStore.gatewayReady) {
      return false;
    }
    if (draft.provider === 'DISCORD') {
      return true;
    }
    return (
      gatewayStore.personalSessionReady &&
      Boolean(gatewayStore.session?.sessionId) &&
      gatewayStore.sessionProvider === draft.provider
    );
  });

  const peerDiscoveryProviderLabel = computed(() => {
    if (draft.provider === 'WECHAT') {
      return 'WeChat';
    }
    if (draft.provider === 'DISCORD') {
      return 'Discord';
    }
    return 'WhatsApp';
  });

  const showPeerDiscoveryInstruction = computed(
    () =>
      !effectiveManualPeerInput.value &&
      canDiscoverPeers.value &&
      !optionsStore.isPeerCandidatesLoading &&
      optionsStore.peerCandidates.length === 0,
  );

  const showTargetOptionsInstruction = computed(
    () =>
      !useManualTargetInput.value &&
      !optionsStore.isTargetOptionsLoading &&
      filteredTargetOptions.value.length === 0,
  );

  const showDiscordIdentityHint = computed(() => draft.provider === 'DISCORD');
  const discordAccountHint = computed(() => providerScopeStore.discordAccountId || '');

  const accountIdModel = computed({
    get: () => {
      if (draft.provider === 'DISCORD' && !draft.accountId.trim()) {
        return discordAccountHint.value;
      }
      return draft.accountId;
    },
    set: (value: string) => {
      draft.accountId = value;
    },
  });

  const scopedAccountId = computed(() => {
    if (draft.provider === 'DISCORD') {
      return normalizeAccountId(draft.accountId) || normalizeAccountId(discordAccountHint.value);
    }
    if (providerScopeStore.requiresPersonalSession) {
      return (
        normalizeAccountId(gatewayStore.session?.accountLabel) || normalizeAccountId(draft.accountId)
      );
    }
    return normalizeAccountId(draft.accountId);
  });

  const scopedBindings = computed(() =>
    bindingStore.bindingsForScope({
      provider: draft.provider,
      transport: draft.transport,
      accountId: scopedAccountId.value,
    }),
  );

  watch(
    () => gatewayStore.session?.accountLabel,
    (accountLabel) => {
      if (providerScopeStore.requiresPersonalSession && accountLabel) {
        draft.accountId = accountLabel;
      }
    },
    { immediate: true },
  );

  watch(
    () => providerScopeStore.selectedProvider,
    (provider) => {
      draft.provider = provider;
      draft.transport = providerScopeStore.resolvedTransport;
      optionsStore.resetPeerCandidates();
      selectedPeerKey.value = '';
      draft.peerId = '';
      draft.threadId = null;

      if (provider === 'WHATSAPP' || provider === 'WECHAT') {
        gatewayStore.setSessionProvider(provider);
        useManualPeerInput.value = false;
        if (gatewayStore.session?.accountLabel) {
          draft.accountId = gatewayStore.session.accountLabel;
        }
      } else {
        useManualPeerInput.value = provider !== 'DISCORD';
        if (provider === 'DISCORD' && providerScopeStore.discordAccountId) {
          draft.accountId = providerScopeStore.discordAccountId;
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => providerScopeStore.discordAccountId,
    (discordAccountId) => {
      if (draft.provider === 'DISCORD' && discordAccountId && !draft.accountId.trim()) {
        draft.accountId = discordAccountId;
      }
    },
    { immediate: true },
  );

  watch(
    () => selectedPeerKey.value,
    (key) => {
      if (effectiveManualPeerInput.value || !key) {
        return;
      }

      const candidate = optionsStore.peerCandidates.find(
        (entry) => buildPeerCandidateKey(entry) === key,
      );
      if (!candidate) {
        return;
      }

      draft.peerId = candidate.peerId;
      draft.threadId = candidate.threadId;
    },
  );

  watch(
    () => selectedTargetId.value,
    (targetId) => {
      if (useManualTargetInput.value || !targetId) {
        return;
      }

      draft.targetId = targetId;
    },
  );

  watch(
    () => draft.targetType,
    () => {
      if (useManualTargetInput.value) {
        return;
      }

      const selectedStillExists = filteredTargetOptions.value.some(
        (option) => option.targetId === selectedTargetId.value,
      );
      if (!selectedStillExists) {
        selectedTargetId.value = '';
        draft.targetId = '';
      }
    },
  );

  function formatPeerCandidateLabel(candidate: GatewayPeerCandidate): string {
    const name = candidate.displayName || candidate.peerId;
    const threadPart = candidate.threadId ? ` | thread ${candidate.threadId}` : '';
    return `${name} (${candidate.peerType})${threadPart}`;
  }

  function onTogglePeerInputMode(): void {
    if (!supportsPeerDiscovery.value) {
      return;
    }

    useManualPeerInput.value = !useManualPeerInput.value;
    if (useManualPeerInput.value) {
      selectedPeerKey.value = '';
      return;
    }

    const existing = optionsStore.peerCandidates.find(
      (candidate) =>
        candidate.peerId === draft.peerId &&
        (candidate.threadId ?? null) === (draft.threadId ?? null),
    );
    selectedPeerKey.value = existing ? buildPeerCandidateKey(existing) : '';
  }

  function onToggleTargetInputMode(): void {
    useManualTargetInput.value = !useManualTargetInput.value;
    if (useManualTargetInput.value) {
      selectedTargetId.value = '';
      return;
    }

    const existing = filteredTargetOptions.value.find((option) => option.targetId === draft.targetId);
    selectedTargetId.value = existing ? existing.targetId : '';
  }

  async function onRefreshPeerCandidates(): Promise<void> {
    if (!supportsPeerDiscovery.value) {
      optionsStore.peerCandidatesError = 'Peer discovery is not available for this provider/transport.';
      return;
    }

    if (!canDiscoverPeers.value) {
      if (!gatewayStore.gatewayReady) {
        optionsStore.peerCandidatesError =
          'Validate gateway connection first before loading peer candidates.';
        return;
      }

      if (draft.provider === 'DISCORD') {
        optionsStore.peerCandidatesError =
          'Discord peer discovery is not ready. Verify gateway Discord setup and retry.';
        return;
      }

      optionsStore.peerCandidatesError =
        `Activate a ${peerDiscoveryProviderLabel.value} personal session first before loading peer candidates.`;
      return;
    }

    try {
      if (draft.provider === 'DISCORD') {
        await optionsStore.loadPeerCandidates(
          draft.accountId || discordAccountHint.value || '',
          {
            includeGroups: true,
            limit: 50,
          },
          draft.provider,
        );
      } else {
        await optionsStore.loadPeerCandidates(
          gatewayStore.session?.sessionId || '',
          {
            includeGroups: true,
            limit: 50,
          },
          draft.provider,
        );
      }

      if (!effectiveManualPeerInput.value && selectedPeerKey.value) {
        const stillExists = optionsStore.peerCandidates.some(
          (candidate) => buildPeerCandidateKey(candidate) === selectedPeerKey.value,
        );
        if (!stillExists) {
          selectedPeerKey.value = '';
          draft.peerId = '';
          draft.threadId = null;
        }
      }
    } catch {
      // Store exposes request errors.
    }
  }

  async function onRefreshTargetOptions(): Promise<void> {
    try {
      await optionsStore.loadTargetOptions();

      if (!useManualTargetInput.value && selectedTargetId.value) {
        const stillExists = filteredTargetOptions.value.some(
          (option) => option.targetId === selectedTargetId.value,
        );
        if (!stillExists) {
          selectedTargetId.value = '';
          draft.targetId = '';
        }
      }
    } catch {
      // Store exposes request errors.
    }
  }

  async function onSaveBinding(): Promise<void> {
    try {
      const resolvedAccountId =
        draft.provider === 'DISCORD' && !draft.accountId.trim()
          ? discordAccountHint.value
          : draft.accountId;

      optionsStore.assertSelectionsFresh({
        draft,
        peerSelectionMode: effectiveManualPeerInput.value ? 'manual' : 'dropdown',
        targetSelectionMode: useManualTargetInput.value ? 'manual' : 'dropdown',
        selectedPeerKey: selectedPeerKey.value,
        selectedTargetId: selectedTargetId.value,
      });

      await bindingStore.upsertBinding({
        ...draft,
        accountId: resolvedAccountId,
        threadId: draft.threadId?.trim() || null,
        // Hidden from setup UX; keep deterministic default until fallback is enabled as an explicit advanced mode.
        allowTransportFallback: false,
      });
    } catch {
      // Stores expose validation and request errors.
    }
  }

  async function onDeleteBinding(bindingId: string): Promise<void> {
    try {
      await bindingStore.deleteBinding(bindingId);
    } catch {
      // Store exposes request errors.
    }
  }

  async function onReloadBindings(): Promise<void> {
    try {
      await bindingStore.loadBindingsIfEnabled();
    } catch {
      // Store exposes request errors.
    }
  }

  return {
    accountIdModel,
    bindingStore,
    buildPeerCandidateKey,
    canDiscoverPeers,
    discordAccountHint,
    draft,
    effectiveManualPeerInput,
    filteredTargetOptions,
    formatPeerCandidateLabel,
    gatewayStore,
    onDeleteBinding,
    onRefreshPeerCandidates,
    onRefreshTargetOptions,
    onReloadBindings,
    onSaveBinding,
    onTogglePeerInputMode,
    onToggleTargetInputMode,
    optionsStore,
    peerDiscoveryProviderLabel,
    scopedBindings,
    selectedPeerKey,
    selectedTargetId,
    showDiscordIdentityHint,
    showPeerDiscoveryInstruction,
    showTargetOptionsInstruction,
    supportsPeerDiscovery,
    useManualPeerInput,
    useManualTargetInput,
  };
}
