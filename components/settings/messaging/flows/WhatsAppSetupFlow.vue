<template>
  <div class="space-y-6">
    <SetupChecklistCard :steps="steps" :active-step="activeStepKey" />
    <GatewayConnectionCard v-if="activeStepKey === 'gateway'" />
    <PersonalSessionSetupCard v-else-if="activeStepKey === 'personal_session'" />
    <ChannelBindingSetupCard v-else-if="activeStepKey === 'binding'" />
    <SetupVerificationCard v-else />
  </div>
</template>

<script setup lang="ts">
import { useMessagingProviderStepFlow } from '~/composables/useMessagingProviderStepFlow';
import ChannelBindingSetupCard from '~/components/settings/messaging/ChannelBindingSetupCard.vue';
import GatewayConnectionCard from '~/components/settings/messaging/GatewayConnectionCard.vue';
import PersonalSessionSetupCard from '~/components/settings/messaging/PersonalSessionSetupCard.vue';
import SetupChecklistCard from '~/components/settings/messaging/SetupChecklistCard.vue';
import SetupVerificationCard from '~/components/settings/messaging/SetupVerificationCard.vue';

const { steps, activeStepKey } = useMessagingProviderStepFlow('WHATSAPP');
</script>
