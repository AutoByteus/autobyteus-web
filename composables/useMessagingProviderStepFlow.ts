import { computed } from 'vue';
import { useMessagingProviderFlowStore } from '~/stores/messagingProviderFlowStore';
import type { MessagingProvider, SetupStepKey } from '~/types/messaging';

export function useMessagingProviderStepFlow(provider: MessagingProvider) {
  const providerFlowStore = useMessagingProviderFlowStore();

  const steps = computed(() => providerFlowStore.stepStatesForProvider(provider));
  const stepOrder = computed(() => providerFlowStore.providerStepOrder(provider));

  const statusByStep = computed(() => {
    const entries = steps.value.map((step) => [step.key, step.status] as const);
    return new Map(entries);
  });

  const activeStepKey = computed<SetupStepKey>(() => {
    for (const stepKey of stepOrder.value) {
      const status = statusByStep.value.get(stepKey);
      if (status !== 'READY' && status !== 'DONE') {
        return stepKey;
      }
    }

    const lastStep = stepOrder.value[stepOrder.value.length - 1];
    return lastStep || 'verification';
  });

  return {
    steps,
    activeStepKey,
  };
}
