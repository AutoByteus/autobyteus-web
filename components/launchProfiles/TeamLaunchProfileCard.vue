<template>
  <div
    class="bg-white rounded-lg border flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-pointer"
    :class="isActive ? 'border-purple-400 hover:border-purple-500' : 'border-gray-200 hover:border-gray-300'"
    @click="isActive ? $emit('open', profile) : $emit('launch', profile)"
  >
    <!-- Card Body -->
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-semibold text-base text-gray-800 break-all" :title="profile.name">
          {{ formattedName }}
        </h3>
        <span
          v-if="isActive"
          class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0"
        >
          Active
        </span>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Team</p>
          <p class="text-gray-700 font-medium">{{ profile.teamDefinition.name }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Members</p>
          <p class="text-gray-700 font-medium">{{ profile.teamDefinition.nodes.length }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinator</p>
          <p class="text-gray-700 font-medium truncate" :title="profile.teamDefinition.coordinatorMemberName">
            {{ profile.teamDefinition.coordinatorMemberName }}
          </p>
        </div>
        <div class="col-span-2">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Created</p>
          <p class="text-gray-700 font-medium">{{ new Date(profile.createdAt).toLocaleString() }}</p>
        </div>
        <div v-if="isActive" class="col-span-2 mt-2">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
          <p class="text-green-700 font-semibold">{{ instanceCount }} Active Instance(s)</p>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="mt-4 flex items-center justify-end space-x-3 border-t border-gray-200 p-4 bg-gray-50/75">
      <button
        @click.stop="$emit('delete', profile)"
        class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
      >
        Delete
      </button>

      <button
        v-if="isActive"
        @click.stop="$emit('open', profile)"
        class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Open
      </button>
      
      <button
        v-else
        @click.stop="$emit('launch', profile)"
        class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Reactivate Profile
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

const props = defineProps<{  profile: TeamLaunchProfile;
  isActive: boolean;
  instanceCount: number;
}>();

defineEmits<{  (e: 'launch', profile: TeamLaunchProfile): void;
  (e: 'delete', profile: TeamLaunchProfile): void;
  (e: 'open', profile: TeamLaunchProfile): void;
}>();

const formattedName = computed(() => {
  return props.profile.name.replace(' Launch ', ' ');
});
</script>
