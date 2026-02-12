<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto p-8 space-y-6">
      <div
        v-if="bootstrapError"
        class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm"
        data-testid="messaging-bootstrap-error"
      >
        {{ bootstrapError }}
      </div>

      <ProviderSetupScopeCard />
      <DiscordSetupFlow v-if="providerScopeStore.selectedProvider === 'DISCORD'" />
      <WeComSetupFlow v-else-if="providerScopeStore.selectedProvider === 'WECOM'" />
      <WeChatSetupFlow v-else-if="providerScopeStore.selectedProvider === 'WECHAT'" />
      <WhatsAppSetupFlow v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useMessagingChannelBindingSetupStore } from '~/stores/messagingChannelBindingSetupStore';
import { useMessagingChannelBindingOptionsStore } from '~/stores/messagingChannelBindingOptionsStore';
import { useMessagingProviderScopeStore } from '~/stores/messagingProviderScopeStore';
import { useGatewayCapabilityStore } from '~/stores/gatewayCapabilityStore';
import { useGatewaySessionSetupStore } from '~/stores/gatewaySessionSetupStore';
import ProviderSetupScopeCard from '~/components/settings/messaging/ProviderSetupScopeCard.vue';
import DiscordSetupFlow from '~/components/settings/messaging/flows/DiscordSetupFlow.vue';
import WeChatSetupFlow from '~/components/settings/messaging/flows/WeChatSetupFlow.vue';
import WeComSetupFlow from '~/components/settings/messaging/flows/WeComSetupFlow.vue';
import WhatsAppSetupFlow from '~/components/settings/messaging/flows/WhatsAppSetupFlow.vue';

const gatewayStore = useGatewaySessionSetupStore();
const capabilityStore = useGatewayCapabilityStore();
const providerScopeStore = useMessagingProviderScopeStore();
const bindingStore = useMessagingChannelBindingSetupStore();
const bindingOptionsStore = useMessagingChannelBindingOptionsStore();

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
