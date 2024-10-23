<template>
  <div :style="computedStyle" class="h-full overflow-hidden flex flex-col rounded-lg">
    <slot></slot>
    <div
      v-if="!isLast"
      class="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors duration-200 rounded-full mx-1" <!-- Added rounded-full and mx-1 for spacing -->
      @mousedown="$emit('resize-start')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  width: {
    type: Number,
    required: true
  },
  isLast: {
    type: Boolean,
    default: false
  },
  useFixedWidth: {
    type: Boolean,
    default: false
  }
});

const computedStyle = computed(() => {
  return props.useFixedWidth 
    ? { width: `${props.width}px` }
    : { width: `${props.width}%` };
});

defineEmits(['resize-start']);
</script>

<style scoped>
/* Add smooth transition for resize */
.w-1 {
  transition: background-color 0.2s ease;
}
</style>