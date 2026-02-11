<template>
  <section class="border border-gray-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-900">Setup Checklist</h3>
    <ul class="mt-3 space-y-2">
      <li
        v-for="step in steps"
        :key="step.key"
        class="flex items-start justify-between gap-3 rounded-md border border-gray-100 px-3 py-2"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800">{{ formatKey(step.key) }}</p>
          <p v-if="step.detail" class="text-xs text-gray-500 mt-1">{{ step.detail }}</p>
        </div>
        <span
          class="text-xs px-2 py-0.5 rounded uppercase tracking-wide"
          :class="badgeClass(step.status)"
          :data-testid="`setup-step-${step.key}`"
        >
          {{ step.status }}
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { SetupStepState, SetupStepKey, SetupStepStateStatus } from '~/types/externalMessaging';

defineProps<{ steps: SetupStepState[] }>();

function formatKey(key: SetupStepKey): string {
  switch (key) {
    case 'gateway':
      return 'Gateway Connection';
    case 'personal_session':
      return 'Personal Session';
    case 'binding':
      return 'Channel Binding';
    case 'verification':
      return 'Setup Verification';
    default:
      return key;
  }
}

function badgeClass(status: SetupStepStateStatus): string {
  if (status === 'READY' || status === 'DONE') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'BLOCKED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
}
</script>
