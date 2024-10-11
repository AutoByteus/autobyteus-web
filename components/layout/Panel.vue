<template>
  <div :style="{ width: `${width}%` }" class="h-full overflow-hidden flex flex-col">
    <slot></slot>
    <div
      v-if="!isLast"
      class="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors duration-200"
      @mousedown="$emit('resize-start')"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  width: {
    type: Number,
    required: true
  },
  isLast: {
    type: Boolean,
    default: false
  }
});

defineEmits(['resize-start']);
</script>