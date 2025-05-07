<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
    <div class="p-4">
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
        <h3 class="font-medium text-gray-900">{{ agent.name }}</h3>
      </div>
      
      <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ agent.description }}</p>
      
      <div class="flex justify-end">
        <button 
          @click="viewDetails"
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
    <div v-if="agent.isRemote" class="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
      Provided by: {{ agent.serverName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  agent: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['run', 'view-details']);

function viewDetails() {
  emit('view-details', props.agent);
}
</script>
