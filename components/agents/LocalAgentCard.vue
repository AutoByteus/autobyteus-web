<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
    <div class="p-5">
      <!-- Header with Icon and Name -->
      <div class="flex items-center mb-3">
        <div class="bg-blue-100 p-2 rounded-md mr-3">
          <span 
            v-if="agent.icon" 
            :class="agent.icon + ' w-5 h-5 text-blue-600'"
          ></span>
          <span 
            v-else 
            class="i-heroicons-cpu-chip-20-solid w-5 h-5 text-blue-600"
          ></span>
        </div>
        <h3 class="font-medium text-gray-900 text-lg">{{ agent.name }}</h3>
      </div>
      
      <!-- Description -->
      <p class="text-sm text-gray-600 mb-4">{{ agent.description }}</p>
      
      <!-- Role -->
      <div class="mb-4">
        <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</span>
        <p class="text-sm text-gray-800 mt-1">{{ agent.role || 'Not specified' }}</p>
      </div>
      
      <!-- Tools Required -->
      <div class="mb-4">
        <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Tools Required</span>
        <div class="flex flex-wrap gap-2 mt-1">
          <template v-if="agent.tools && agent.tools.length > 0">
            <span 
              v-for="tool in displayedTools" 
              :key="tool" 
              class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {{ tool }}
            </span>
            <span 
              v-if="agent.tools.length > maxItemsToShow" 
              class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              +{{ agent.tools.length - maxItemsToShow }} more
            </span>
          </template>
          <span v-else class="text-xs text-gray-500 italic">No tools specified</span>
        </div>
      </div>
      
      <!-- Skills -->
      <div class="mb-4">
        <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Skills</span>
        <div class="flex flex-wrap gap-2 mt-1">
          <template v-if="agent.skills && agent.skills.length > 0">
            <span 
              v-for="skill in displayedSkills" 
              :key="skill" 
              class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {{ skill }}
            </span>
            <span 
              v-if="agent.skills.length > maxItemsToShow" 
              class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              +{{ agent.skills.length - maxItemsToShow }} more
            </span>
          </template>
          <span v-else class="text-xs text-gray-500 italic">No skills specified</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end items-center mt-4">
        <button 
          @click="$emit('view-details', agent)"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mr-3"
        >
          View Details
        </button>
        <button 
          @click="$emit('run', agent)"
          class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Run Agent
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LocalAgent } from '~/stores/agents';

const props = defineProps({
  agent: {
    type: Object as () => LocalAgent,
    required: true
  },
  maxItemsToShow: {
    type: Number,
    default: 3
  }
});

const emit = defineEmits(['run', 'view-details']);

const displayedTools = computed(() => {
  if (!props.agent.tools || props.agent.tools.length === 0) return [];
  return props.agent.tools.slice(0, props.maxItemsToShow);
});

const displayedSkills = computed(() => {
  if (!props.agent.skills || props.agent.skills.length === 0) return [];
  return props.agent.skills.slice(0, props.maxItemsToShow);
});
</script>
