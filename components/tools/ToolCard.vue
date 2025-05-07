<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
    <div class="p-4">
      <div class="flex items-center mb-3">
        <div :class="tool.isRemote ? 'bg-purple-100' : 'bg-indigo-100'" class="p-2 rounded-md mr-3">
          <span 
            :class="[tool.icon || 'i-heroicons-wrench-screwdriver-20-solid', tool.isRemote ? 'text-purple-600' : 'text-indigo-600', 'w-5 h-5']"
          ></span>
        </div>
        <h3 class="font-medium text-gray-900">{{ tool.name }}</h3>
      </div>
      <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ tool.description }}</p>
      <div class="flex justify-between items-center">
        <span 
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
          :class="tool.isRemote ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'"
        >
          {{ tool.isRemote ? 'Remote' : 'Local' }}
        </span>
        <div class="flex space-x-2">
          <button 
            @click="$emit('details', tool)"
            class="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            <span class="i-heroicons-information-circle-20-solid w-4 h-4"></span>
          </button>
          <button 
            @click="$emit('run', tool)"
            class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Run
            <span class="i-heroicons-arrow-right-20-solid w-4 h-4 ml-1"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
});

defineEmits(['run', 'details']);
</script>
