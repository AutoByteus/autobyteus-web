<template>
  <div
    @click="$emit('select-profile', profile.id)"
    class="p-3 rounded-lg border cursor-pointer transition-all duration-150 group"
    :class="isActive
      ? 'bg-purple-50 border-purple-500 shadow-sm' 
      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'"
  >
    <div class="flex justify-between items-start">
      <div class="flex items-start space-x-3 min-w-0">
        <div class="flex-shrink-0 pt-1">
          <span class="i-heroicons-users-20-solid w-5 h-5 text-gray-400"></span>
        </div>
        <div class="min-w-0">
          <p class="font-medium text-gray-800 break-words truncate" :title="profile.name">{{ profile.name }}</p>
          <p class="text-xs text-gray-500 mt-1 truncate">
            Team: {{ profile.teamDefinition.name }}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-1">
        <button 
          @click.stop="$emit('relaunch-profile', profile)" 
          class="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Re-launch Team"
        >
          <span class="i-heroicons-arrow-path-20-solid w-5 h-5"></span>
        </button>
        <button 
          @click.stop="$emit('delete-profile', profile.id)" 
          class="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Profile"
        >
          <span class="i-heroicons-x-mark-20-solid w-5 h-5"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

defineProps<{  profile: TeamLaunchProfile;
  isActive: boolean;
}>();

defineEmits(['select-profile', 'delete-profile', 'relaunch-profile']);
</script>
