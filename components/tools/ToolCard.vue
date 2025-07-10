<template>
  <div 
    class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    @click="$emit('details', tool)"
  >
    <div class="p-4">
      <div class="flex items-center mb-3">
        <div :class="isLocal ? 'bg-indigo-100' : 'bg-purple-100'" class="p-2 rounded-md mr-3">
          <span 
            :class="[icon, isLocal ? 'text-indigo-600' : 'text-purple-600', 'w-5 h-5']"
          ></span>
        </div>
        <h3 class="font-medium text-gray-900">{{ tool.name }}</h3>
      </div>
      <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ tool.description }}</p>
      <div class="flex justify-between items-center">
        <span 
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
          :class="isLocal ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'"
        >
          {{ source }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Tool } from '~/stores/toolManagementStore';

const props = defineProps<{  tool: Tool;
  source: string;
}>();

defineEmits(['details']);

const isLocal = computed(() => props.tool.category === 'LOCAL');

const icon = computed(() => {
  if (isLocal.value) {
    return 'i-heroicons-wrench-screwdriver-20-solid';
  }
  return 'i-heroicons-cloud-arrow-down-20-solid';
});
</script>
