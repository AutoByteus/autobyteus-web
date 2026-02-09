<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">External Messaging</h2>
        <p class="text-sm text-gray-500 mt-1">Setup-only configuration for gateway, session, and channel binding.</p>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-8 space-y-6">
      <div
        v-if="bootstrapError"
        class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm"
        data-testid="external-messaging-bootstrap-error"
      >
        {{ bootstrapError }}
      </div>

      <ProviderSetupScopeCard />
      <SetupChecklistCard :steps="setupStore.stepStates" />
      <GatewayConnectionCard />
      <PersonalSessionSetupCard />
      <ChannelBindingSetupCard />
      <SetupVerificationCard />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useExternalChannelBindingSetupStore } from '~/stores/externalChannelBindingSetupStore';
import { useExternalChannelBindingOptionsStore } from '~/stores/externalChannelBindingOptionsStore';
import { useExternalMessagingSetupStore } from '~/stores/externalMessagingSetupStore';
import { useExternalMessagingProviderScopeStore } from '~/stores/externalMessagingProviderScopeStore';
import { useGatewayCapabilityStore } from '~/stores/gatewayCapabilityStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';
import ChannelBindingSetupCard from '~/components/settings/externalMessaging/ChannelBindingSetupCard.vue';
import GatewayConnectionCard from '~/components/settings/externalMessaging/GatewayConnectionCard.vue';
import PersonalSessionSetupCard from '~/components/settings/externalMessaging/PersonalSessionSetupCard.vue';
import ProviderSetupScopeCard from '~/components/settings/externalMessaging/ProviderSetupScopeCard.vue';
import SetupChecklistCard from '~/components/settings/externalMessaging/SetupChecklistCard.vue';
import SetupVerificationCard from '~/components/settings/externalMessaging/SetupVerificationCard.vue';

const gatewayStore = useGatewaySessionSetupStore();
const capabilityStore = useGatewayCapabilityStore();
const providerScopeStore = useExternalMessagingProviderScopeStore();
const bindingStore = useExternalChannelBindingSetupStore();
const bindingOptionsStore = useExternalChannelBindingOptionsStore();
const setupStore = useExternalMessagingSetupStore();

const bootstrapError = ref<string | null>(null);

async function bootstrapSetupState(): Promise<void> {
  bootstrapError.value = null;

  gatewayStore.initializeFromConfig();

  try {
    await capabilityStore.loadCapabilities();
    providerScopeStore.initialize(capabilityStore.capabilities);
    await capabilityStore.loadWeComAccounts();
    await bindingStore.loadCapabilities();
    await bindingStore.loadBindingsIfEnabled();
    await bindingOptionsStore.loadTargetOptions();
  } catch (error) {
    bootstrapError.value = error instanceof Error ? error.message : 'Failed to bootstrap setup state';
  }
}

onMounted(async () => {
  await bootstrapSetupState();
});

watch(
  () => providerScopeStore.selectedProvider,
  (provider) => {
    if (provider === 'WHATSAPP' || provider === 'WECHAT') {
      gatewayStore.setSessionProvider(provider);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  gatewayStore.stopSessionStatusAutoSync('view_unmounted');
});
</script>
