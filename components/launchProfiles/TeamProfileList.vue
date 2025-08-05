<template>
  <div class="space-y-2">
    <TeamProfileCard
      v-for="profile in profiles" 
      :key="profile.id"
      :profile="profile"
      :is-active="selectedLaunchProfileStore.selectedProfileId === profile.id && selectedLaunchProfileStore.selectedProfileType === 'team'"
      @select-profile="$emit('select-profile', profile.id)"
      @delete-profile="$emit('delete-profile', profile.id)"
      @relaunch-profile="$emit('relaunch-profile', profile)"
    />
    <div v-if="profiles.length === 0" class="text-center text-xs text-gray-500 py-4">
      <p>No active team profiles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import TeamProfileCard from './TeamProfileCard.vue';

defineProps<{  profiles: TeamLaunchProfile[];
}>();

defineEmits(['select-profile', 'delete-profile', 'relaunch-profile']);

const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
</script>
