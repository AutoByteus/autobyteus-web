<template>
  <div class="flex items-center space-x-2">
    <button 
      @click="$emit('newAgent')" 
      class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-500 tooltip transition-colors"
      aria-label="New Agent"
      data-tooltip="New Agent"
    >
      <PlusCircleIcon class="w-6 h-6" />
    </button>
    <button 
      @click="$emit('openHistory')" 
      class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 tooltip transition-colors"
      aria-label="History"
      data-tooltip="History"
    >
      <ClockIcon class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusCircleIcon, ClockIcon } from '@heroicons/vue/24/solid';

defineEmits(['newAgent', 'openHistory']);
</script>

<style scoped>
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px; 
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}
</style>
