<template>
  <section class="border border-gray-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-900">Setup Provider</h3>
    <p class="mt-1 text-xs text-gray-500">
      Select which external messaging provider you are configuring right now.
    </p>

    <div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
      <button
        v-for="option in providerScopeStore.options"
        :key="option.provider"
        type="button"
        class="rounded-md border px-3 py-2 text-left transition-colors"
        :class="providerCardClass(option.provider)"
        @click="providerScopeStore.setSelectedProvider(option.provider)"
        :data-testid="`provider-scope-${option.provider}`"
      >
        <p class="text-sm font-medium">{{ option.label }}</p>
        <p class="mt-1 text-xs opacity-80">{{ option.description }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';
import type { ExternalMessagingProvider } from '~/types/externalMessaging';

const providerScopeStore = useExternalMessagingProviderScopeStore();

function providerCardClass(provider: ExternalMessagingProvider): string {
  if (providerScopeStore.selectedProvider === provider) {
    return 'border-blue-300 bg-blue-50 text-blue-800';
  }
  return 'border-gray-300 bg-white text-gray-700 hover:border-gray-400';
}
</script>
