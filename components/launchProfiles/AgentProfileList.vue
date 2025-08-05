<template>
  <div class="space-y-2">
    <AgentProfileCard
      v-for="profile in profiles" 
      :key="profile.id"
      :profile="profile"
      :is-active="selectedLaunchProfileStore.selectedProfileId === profile.id && selectedLaunchProfileStore.selectedProfileType === 'agent'"
      @select-profile="$emit('select-profile', profile.id)"
      @delete-profile="$emit('delete-profile', profile.id)"
    />
    <div v-if="profiles.length === 0" class="text-center text-xs text-gray-500 py-4">
      <p>No active agent profiles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentLaunchProfile } from '~/stores/agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import AgentProfileCard from './AgentProfileCard.vue';

defineProps<{  profiles: AgentLaunchProfile[];
}>();

defineEmits(['select-profile', 'delete-profile']);

const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
</script>
