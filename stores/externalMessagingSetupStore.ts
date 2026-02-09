import { defineStore } from 'pinia';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';
import type {
  BindingReadinessSnapshot,
  GatewayReadinessSnapshot,
  SetupBlocker,
  SetupStepState,
  SetupVerificationResult,
} from '~/types/externalMessaging';

interface ExternalMessagingSetupState {
  verificationResult: SetupVerificationResult | null;
  isVerifying: boolean;
  verificationError: string | null;
}

function nowIsoString(): string {
  return new Date().toISOString();
}

export const useExternalMessagingSetupStore = defineStore('externalMessagingSetupStore', {
  state: (): ExternalMessagingSetupState => ({
    verificationResult: null,
    isVerifying: false,
    verificationError: null,
  }),

  getters: {
    stepStates(): SetupStepState[] {
      const gatewayStore = useGatewaySessionSetupStore();
      const bindingStore = useExternalChannelBindingSetupStore();
      const providerScopeStore = useExternalMessagingProviderScopeStore();

      const gatewaySnapshot = gatewayStore.getReadinessSnapshot();
      const bindingSnapshot = bindingStore.getReadinessSnapshot();

      const gatewayStep: SetupStepState = {
        key: 'gateway',
        status: gatewaySnapshot.gatewayReady
          ? 'READY'
          : gatewaySnapshot.gatewayBlockedReason
            ? 'BLOCKED'
            : 'PENDING',
        detail: gatewaySnapshot.gatewayBlockedReason || undefined,
      };

      const personalSessionStep: SetupStepState = {
        key: 'personal_session',
        status: providerScopeStore.requiresPersonalSession
          ? gatewaySnapshot.personalSessionReady
            ? 'READY'
            : gatewaySnapshot.personalSessionBlockedReason
              ? 'BLOCKED'
              : 'PENDING'
          : 'READY',
        detail: providerScopeStore.requiresPersonalSession
          ? gatewaySnapshot.personalSessionBlockedReason || undefined
          : 'Not required for WeCom App setup.',
      };

      const bindingStep: SetupStepState = {
        key: 'binding',
        status: !bindingSnapshot.capabilityEnabled
          ? 'BLOCKED'
          : bindingSnapshot.hasBindings
            ? 'READY'
            : bindingSnapshot.bindingError
              ? 'BLOCKED'
              : 'PENDING',
        detail: bindingSnapshot.capabilityBlockedReason || bindingSnapshot.bindingError || undefined,
      };

      const verificationStep: SetupStepState = {
        key: 'verification',
        status: this.verificationResult?.ready
          ? 'DONE'
          : this.verificationError
            ? 'BLOCKED'
            : 'PENDING',
        detail: this.verificationError || undefined,
      };

      return [gatewayStep, personalSessionStep, bindingStep, verificationStep];
    },
  },

  actions: {
    mergeReadiness(
      gatewaySnapshot: GatewayReadinessSnapshot,
      bindingSnapshot: BindingReadinessSnapshot,
    ): SetupVerificationResult {
      const blockers: SetupBlocker[] = [];

      if (!gatewaySnapshot.gatewayReady) {
        blockers.push({
          code: 'GATEWAY_UNREACHABLE',
          step: 'gateway',
          message: gatewaySnapshot.gatewayBlockedReason || 'Gateway validation is required.',
        });
      }

      if (!gatewaySnapshot.personalSessionReady) {
        const providerScopeStore = useExternalMessagingProviderScopeStore();
        if (providerScopeStore.requiresPersonalSession) {
          const isPersonalModeIssue =
            (gatewaySnapshot.personalSessionBlockedReason || '')
              .toLowerCase()
              .includes('personal mode');
          blockers.push({
            code: isPersonalModeIssue ? 'PERSONAL_MODE_DISABLED' : 'SESSION_NOT_READY',
            step: 'personal_session',
            message:
              gatewaySnapshot.personalSessionBlockedReason ||
              'Start and activate a personal session before verification.',
          });
        }
      }

      if (!bindingSnapshot.capabilityEnabled) {
        blockers.push({
          code: 'SERVER_BINDING_API_UNAVAILABLE',
          step: 'binding',
          message:
            bindingSnapshot.capabilityBlockedReason ||
            'Server binding setup APIs are currently unavailable.',
        });
      } else if (!bindingSnapshot.hasBindings) {
        blockers.push({
          code: 'BINDING_NOT_READY',
          step: 'binding',
          message: bindingSnapshot.bindingError || 'At least one channel binding is required.',
        });
      }

      return {
        ready: blockers.length === 0,
        blockers,
        checkedAt: nowIsoString(),
      };
    },

    setVerificationResult(result: SetupVerificationResult) {
      this.verificationResult = result;
    },

    async runSetupVerification(): Promise<SetupVerificationResult> {
      this.isVerifying = true;
      this.verificationError = null;

      try {
        const gatewayStore = useGatewaySessionSetupStore();
        const bindingStore = useExternalChannelBindingSetupStore();

        const result = this.mergeReadiness(
          gatewayStore.getReadinessSnapshot(),
          bindingStore.getReadinessSnapshot(),
        );

        this.verificationResult = result;
        return result;
      } catch (error) {
        this.verificationError = error instanceof Error ? error.message : 'Setup verification failed';

        const result: SetupVerificationResult = {
          ready: false,
          blockers: [
            {
              code: 'VERIFICATION_ERROR',
              step: 'verification',
              message: this.verificationError,
            },
          ],
          checkedAt: nowIsoString(),
        };

        this.verificationResult = result;
        return result;
      } finally {
        this.isVerifying = false;
      }
    },
  },
});
