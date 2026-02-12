<template>
  <section class="border border-gray-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-900">Setup Verification</h3>
    <p class="mt-1 text-xs text-gray-500">
      Run readiness verification across gateway, session, and binding setup.
    </p>

    <div class="mt-3 flex items-center gap-3">
      <button
        class="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
        :disabled="verificationStore.isVerifying"
        @click="onRunVerification"
        data-testid="run-setup-verification"
      >
        {{ verificationStore.isVerifying ? 'Checking...' : 'Run Verification' }}
      </button>

      <span
        class="text-xs px-2 py-0.5 rounded uppercase tracking-wide"
        :class="badgeClass"
        data-testid="verification-status"
      >
        {{ verificationLabel }}
      </span>
    </div>

    <ul class="mt-3 space-y-2">
      <li
        v-for="check in checks"
        :key="check.key"
        class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
        :data-testid="`verification-check-${check.key}`"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-medium text-gray-800">{{ check.label }}</p>
          <span class="rounded px-2 py-0.5 text-xs uppercase tracking-wide" :class="checkBadgeClass(check.status)">
            {{ check.status }}
          </span>
        </div>
        <p v-if="check.detail" class="mt-1 text-xs text-gray-600">{{ check.detail }}</p>
      </li>
    </ul>

    <ul v-if="verificationStore.verificationResult?.blockers?.length" class="mt-3 space-y-2">
      <li
        v-for="blocker in verificationStore.verificationResult.blockers"
        :key="`${blocker.code}-${blocker.step}`"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2"
      >
        <p class="text-sm text-red-700">{{ blocker.message }}</p>
        <p class="text-xs text-red-500 mt-1">{{ blocker.code }} ({{ blocker.step }})</p>
        <div v-if="blocker.actions?.length" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="action in blocker.actions"
            :key="`${blocker.code}-${action.type}`"
            type="button"
            class="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700"
            @click="onRunBlockerAction(action)"
            :data-testid="`verification-action-${action.type}`"
          >
            {{ action.label }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { routerKey } from 'vue-router';
import { useMessagingChannelBindingOptionsStore } from '~/stores/messagingChannelBindingOptionsStore';
import { useMessagingVerificationStore } from '~/stores/messagingVerificationStore';
import type { SetupBlockerAction, VerificationCheckStatus } from '~/types/messaging';

const router = inject(routerKey, null);
const optionsStore = useMessagingChannelBindingOptionsStore();
const verificationStore = useMessagingVerificationStore();

const checks = computed(() =>
  verificationStore.isVerifying || verificationStore.verificationChecks.length > 0
    ? verificationStore.verificationChecks
    : verificationStore.verificationResult?.checks || [],
);

const verificationLabel = computed(() => {
  if (verificationStore.isVerifying) {
    return 'RUNNING';
  }
  if (verificationStore.verificationResult?.ready) {
    return 'READY';
  }
  if (verificationStore.verificationResult && !verificationStore.verificationResult.ready) {
    return 'BLOCKED';
  }
  return 'NOT_RUN';
});

const badgeClass = computed(() => {
  if (verificationLabel.value === 'RUNNING') {
    return 'bg-blue-100 text-blue-700';
  }
  if (verificationLabel.value === 'READY') {
    return 'bg-green-100 text-green-700';
  }
  if (verificationLabel.value === 'BLOCKED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
});

async function onRunVerification(): Promise<void> {
  await verificationStore.runSetupVerification();
}

function checkBadgeClass(status: VerificationCheckStatus): string {
  if (status === 'PASSED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'FAILED') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'RUNNING') {
    return 'bg-blue-100 text-blue-700';
  }
  if (status === 'SKIPPED') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-gray-200 text-gray-700';
}

async function onRunBlockerAction(action: SetupBlockerAction): Promise<void> {
  if (action.type === 'RERUN_VERIFICATION') {
    await onRunVerification();
    return;
  }
  if (action.type === 'REFRESH_TARGETS') {
    try {
      await optionsStore.loadTargetOptions();
    } catch {
      // Target options store exposes errors.
    }
    return;
  }
  if (action.type === 'OPEN_TEAM_RUNTIME') {
    if (router) {
      await router.push({ path: '/agent-teams', query: { view: 'team-list' } });
    }
    return;
  }
  if (action.type === 'OPEN_AGENT_RUNTIME') {
    if (router) {
      await router.push('/agents');
    }
  }
}
</script>
