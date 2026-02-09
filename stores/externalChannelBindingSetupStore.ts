import { defineStore } from 'pinia';
import { getApolloClient } from '~/utils/apolloClient';
import {
  EXTERNAL_CHANNEL_CAPABILITIES,
  EXTERNAL_CHANNEL_BINDINGS,
} from '~/graphql/queries/externalChannelSetupQueries';
import {
  DELETE_EXTERNAL_CHANNEL_BINDING,
  UPSERT_EXTERNAL_CHANNEL_BINDING,
} from '~/graphql/mutations/externalChannelSetupMutations';
import type {
  BindingReadinessSnapshot,
  ExternalChannelBindingDraft,
  ExternalChannelBindingModel,
  ExternalChannelCapabilityModel,
} from '~/types/externalMessaging';

interface BindingSetupState {
  capabilities: ExternalChannelCapabilityModel;
  capabilityLoaded: boolean;
  capabilityLoading: boolean;
  capabilityError: string | null;
  capabilityBlocked: boolean;
  rolloutGateError: string | null;
  bindings: ExternalChannelBindingModel[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fieldErrors: Partial<Record<keyof ExternalChannelBindingDraft, string>>;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'External channel request failed';
}

function hasSchemaFieldMissingError(error: unknown): boolean {
  const message = normalizeErrorMessage(error).toLowerCase();
  return (
    message.includes('cannot query field') ||
    message.includes('cannot return null for non-nullable field') ||
    message.includes('unknown argument')
  );
}

function sortByUpdatedAtDesc(bindings: ExternalChannelBindingModel[]): ExternalChannelBindingModel[] {
  return [...bindings].sort((a, b) => {
    const left = new Date(a.updatedAt).getTime();
    const right = new Date(b.updatedAt).getTime();
    return right - left;
  });
}

function buildSupportedPairSet(capabilities: ExternalChannelCapabilityModel): Set<string> {
  const pairs = capabilities.acceptedProviderTransportPairs || [];
  return new Set(
    pairs
      .filter((pair) => typeof pair === 'string')
      .map((pair) => pair.trim().toUpperCase())
      .filter((pair) => pair.length > 0),
  );
}

function isProviderTransportSupported(
  draft: ExternalChannelBindingDraft,
  capabilities: ExternalChannelCapabilityModel,
): boolean {
  const supportedPairs = buildSupportedPairSet(capabilities);
  if (supportedPairs.size === 0) {
    // Backward-compatible fallback for older server versions.
    if (draft.provider === 'WECOM') {
      return draft.transport === 'BUSINESS_API';
    }
    if (draft.provider === 'WECHAT') {
      return draft.transport === 'PERSONAL_SESSION';
    }
    return true;
  }
  const key = `${draft.provider}:${draft.transport}`.toUpperCase();
  return supportedPairs.has(key);
}

export const useExternalChannelBindingSetupStore = defineStore('externalChannelBindingSetupStore', {
  state: (): BindingSetupState => ({
    capabilities: {
      bindingCrudEnabled: false,
      reason: undefined,
      acceptedProviderTransportPairs: [],
    },
    capabilityLoaded: false,
    capabilityLoading: false,
    capabilityError: null,
    capabilityBlocked: false,
    rolloutGateError: null,
    bindings: [],
    isLoading: false,
    isMutating: false,
    error: null,
    fieldErrors: {},
  }),

  actions: {
    async loadCapabilities() {
      this.capabilityLoading = true;
      this.capabilityError = null;

      try {
        const client = getApolloClient();
        const { data, errors } = await client.query({
          query: EXTERNAL_CHANNEL_CAPABILITIES,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((entry: { message: string }) => entry.message).join(', '));
        }

        const capabilities = data?.externalChannelCapabilities as
          | ExternalChannelCapabilityModel
          | undefined;

        this.capabilities = capabilities || {
          bindingCrudEnabled: false,
          reason: 'Capability response unavailable',
          acceptedProviderTransportPairs: [],
        };
        this.capabilityBlocked = !this.capabilities.bindingCrudEnabled;
        this.capabilityLoaded = true;
        this.rolloutGateError = null;
        return this.capabilities;
      } catch (error) {
        this.capabilityLoaded = true;
        this.capabilityBlocked = true;
        this.capabilityError = normalizeErrorMessage(error);
        this.capabilities = {
          bindingCrudEnabled: false,
          reason: this.capabilityError,
          acceptedProviderTransportPairs: [],
        };
        throw error;
      } finally {
        this.capabilityLoading = false;
      }
    },

    async loadBindingsIfEnabled() {
      this.error = null;

      if (!this.capabilities.bindingCrudEnabled) {
        this.bindings = [];
        return [];
      }

      this.isLoading = true;
      try {
        const client = getApolloClient();
        const { data, errors } = await client.query({
          query: EXTERNAL_CHANNEL_BINDINGS,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((entry: { message: string }) => entry.message).join(', '));
        }

        const bindings = (data?.externalChannelBindings || []) as ExternalChannelBindingModel[];
        this.bindings = sortByUpdatedAtDesc(bindings);
        return this.bindings;
      } catch (error) {
        this.error = normalizeErrorMessage(error);

        if (hasSchemaFieldMissingError(error)) {
          this.capabilityBlocked = true;
          this.rolloutGateError = this.error;
          this.capabilities = {
            bindingCrudEnabled: false,
            reason: this.error,
          };
        }

        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    validateDraft(
      draft: ExternalChannelBindingDraft,
    ): Partial<Record<keyof ExternalChannelBindingDraft, string>> {
      const errors: Partial<Record<keyof ExternalChannelBindingDraft, string>> = {};

      if (!draft.accountId.trim()) {
        errors.accountId = 'Account ID is required';
      }
      if (!draft.peerId.trim()) {
        errors.peerId = 'Peer ID is required';
      }
      if (!draft.targetId.trim()) {
        errors.targetId = 'Target ID is required';
      }
      if (!isProviderTransportSupported(draft, this.capabilities)) {
        errors.transport = `Transport ${draft.transport} is not supported for provider ${draft.provider}.`;
      }

      return errors;
    },

    async upsertBinding(draft: ExternalChannelBindingDraft) {
      this.error = null;

      if (!this.capabilities.bindingCrudEnabled) {
        try {
          await this.loadCapabilities();
        } catch (error) {
          this.error = this.capabilityError || 'Binding API is not available on the current server.';
          throw error;
        }
      }

      this.fieldErrors = this.validateDraft(draft);

      if (Object.keys(this.fieldErrors).length > 0) {
        throw new Error('Binding validation failed');
      }

      if (!this.capabilities.bindingCrudEnabled) {
        this.error =
          this.capabilities.reason || 'Binding API is not available on the current server.';
        throw new Error(this.error);
      }

      this.isMutating = true;
      try {
        const client = getApolloClient();
        const { data, errors } = await client.mutate({
          mutation: UPSERT_EXTERNAL_CHANNEL_BINDING,
          variables: {
            input: {
              id: draft.id,
              provider: draft.provider,
              transport: draft.transport,
              accountId: draft.accountId,
              peerId: draft.peerId,
              threadId: draft.threadId,
              targetType: draft.targetType,
              targetId: draft.targetId,
              allowTransportFallback: draft.allowTransportFallback,
            },
          },
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((entry: { message: string }) => entry.message).join(', '));
        }

        const binding = data?.upsertExternalChannelBinding as ExternalChannelBindingModel | undefined;
        if (!binding) {
          throw new Error('Binding mutation returned empty payload');
        }

        this.applyUpsertResult(binding);
        return binding;
      } catch (error) {
        this.error = normalizeErrorMessage(error);
        if (hasSchemaFieldMissingError(error)) {
          this.capabilityBlocked = true;
          this.rolloutGateError = this.error;
          this.capabilities = {
            bindingCrudEnabled: false,
            reason: this.error,
          };
        }
        throw error;
      } finally {
        this.isMutating = false;
      }
    },

    applyUpsertResult(binding: ExternalChannelBindingModel) {
      const index = this.bindings.findIndex((item) => item.id === binding.id);
      if (index >= 0) {
        this.bindings[index] = binding;
      } else {
        this.bindings.push(binding);
      }
      this.bindings = sortByUpdatedAtDesc(this.bindings);
    },

    async deleteBinding(bindingId: string) {
      if (!this.capabilities.bindingCrudEnabled) {
        try {
          await this.loadCapabilities();
        } catch (error) {
          this.error = this.capabilityError || 'Binding API is not available on the current server.';
          throw error;
        }
      }

      if (!this.capabilities.bindingCrudEnabled) {
        this.error =
          this.capabilities.reason || 'Binding API is not available on the current server.';
        throw new Error(this.error);
      }

      this.isMutating = true;
      this.error = null;

      try {
        const client = getApolloClient();
        const { data, errors } = await client.mutate({
          mutation: DELETE_EXTERNAL_CHANNEL_BINDING,
          variables: {
            id: bindingId,
          },
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((entry: { message: string }) => entry.message).join(', '));
        }

        if (!data?.deleteExternalChannelBinding) {
          throw new Error('Delete binding failed');
        }

        this.bindings = this.bindings.filter((binding) => binding.id !== bindingId);
      } catch (error) {
        this.error = normalizeErrorMessage(error);
        throw error;
      } finally {
        this.isMutating = false;
      }
    },

    getCapabilitySnapshot() {
      return {
        enabled: this.capabilities.bindingCrudEnabled,
        blockedReason: this.capabilities.bindingCrudEnabled
          ? null
          : this.capabilities.reason || this.capabilityError || 'Binding API unavailable',
      };
    },

    getReadinessSnapshot(): BindingReadinessSnapshot {
      return {
        capabilityEnabled: this.capabilities.bindingCrudEnabled,
        capabilityBlockedReason: this.capabilities.bindingCrudEnabled
          ? null
          : this.capabilities.reason || this.capabilityError || 'Binding API unavailable',
        hasBindings: this.bindings.length > 0,
        bindingError: this.error,
      };
    },
  },
});
