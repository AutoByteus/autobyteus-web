<template>
  <div class="space-y-2">
    <div 
      v-for="profile in launchProfiles" 
      :key="profile.id"
      @click="$emit('select-profile', profile.id)"
      class="p-3 rounded-lg border cursor-pointer transition-all duration-150"
      :class="isActive(profile.id) 
        ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
    >
      <div class="flex justify-between items-start">
        <div>
          <p class="font-medium text-gray-900 break-words">{{ profile.name }}</p>
          <p class="text-xs text-gray-500 mt-1">
            Created: {{ new Date(profile.createdAt).toLocaleString() }}
          </p>
        </div>
        <button 
          @click.stop="$emit('delete-profile', profile.id)" 
          class="ml-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
          title="Delete Launch Profile"
        >
          <span class="i-heroicons-x-mark-20-solid w-5 h-5"></span>
        </button>
      </div>
    </div>
    <div v-if="launchProfiles && launchProfiles.length === 0" class="text-center text-gray-500 pt-10">
      <p>No active launch profiles.</p>
      <p class="text-sm">Create one from the Agents page.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import type { AgentLaunchProfile } from '~/stores/agentLaunchProfileStore';

const props = defineProps<{  launchProfiles: AgentLaunchProfile[];
  activeProfileId: string | null;
}>();

defineEmits(['select-profile', 'delete-profile']);

const { launchProfiles, activeProfileId } = toRefs(props);

const isActive = (profileId: string) => {
  return activeProfileId.value === profileId;
};
</script>
