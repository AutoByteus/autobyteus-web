<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">{{ title }}</h2>
      <div v-if="showAddButton">
        <button
          @click="$emit('add')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
          Add {{ addButtonText }}
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ToolCard 
        v-for="tool in tools" 
        :key="tool.id" 
        :tool="tool"
        @run="$emit('run', tool)"
        @details="$emit('details', tool)"
      />
      <div v-if="tools.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
        <span :class="emptyIcon + ' w-10 h-10 text-gray-400 mx-auto mb-3'"></span>
        <p class="text-gray-500">{{ emptyMessage }}</p>
        <button
          v-if="showEmptyButton"
          @click="$emit('add')"
          class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
          {{ emptyButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import ToolCard from './ToolCard.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  tools: {
    type: Array,
    required: true
  },
  showAddButton: {
    type: Boolean,
    default: false
  },
  addButtonText: {
    type: String,
    default: 'Tool'
  },
  emptyIcon: {
    type: String,
    default: 'i-heroicons-face-frown-20-solid'
  },
  emptyMessage: {
    type: String,
    default: 'No tools available'
  },
  showEmptyButton: {
    type: Boolean,
    default: false
  },
  emptyButtonText: {
    type: String,
    default: 'Add Tool'
  }
});

defineEmits(['run', 'details', 'add']);
</script>
