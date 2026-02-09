<template>
  <section class="border border-gray-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-900">Setup Verification</h3>
    <p class="mt-1 text-xs text-gray-500">
      Run readiness verification across gateway, session, and binding setup.
    </p>

    <div class="mt-3 flex items-center gap-3">
      <button
        class="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
        :disabled="setupStore.isVerifying"
        @click="onRunVerification"
        data-testid="run-setup-verification"
      >
        {{ setupStore.isVerifying ? 'Checking...' : 'Run Verification' }}
      </button>

      <span
        class="text-xs px-2 py-0.5 rounded uppercase tracking-wide"
        :class="badgeClass"
        data-testid="verification-status"
      >
        {{ verificationLabel }}
      </span>
    </div>

    <ul v-if="setupStore.verificationResult?.blockers?.length" class="mt-3 space-y-2">
      <li
        v-for="blocker in setupStore.verificationResult.blockers"
        :key="`${blocker.code}-${blocker.step}`"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2"
      >
        <p class="text-sm text-red-700">{{ blocker.message }}</p>
        <p class="text-xs text-red-500 mt-1">{{ blocker.code }} ({{ blocker.step }})</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useExternalMessagingSetupStore } from '~/stores/externalMessagingSetupStore';

const setupStore = useExternalMessagingSetupStore();

const verificationLabel = computed(() => {
  if (setupStore.verificationResult?.ready) {
    return 'READY';
  }
  if (setupStore.verificationResult && !setupStore.verificationResult.ready) {
    return 'BLOCKED';
  }
  return 'NOT_RUN';
});

const badgeClass = computed(() => {
  if (verificationLabel.value === 'READY') {
    return 'bg-green-100 text-green-700';
  }
  if (verificationLabel.value === 'BLOCKED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
});

async function onRunVerification(): Promise<void> {
  await setupStore.runSetupVerification();
}
</script>
