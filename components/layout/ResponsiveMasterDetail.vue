<template>
  <div class="flex flex-col lg:flex-row h-full">
    <!-- Sidebar / Master View -->
    <!-- Desktop: Vertical Sidebar (w-56 or w-64 depending on prop) -->
    <!-- Mobile/Tablet: Horizontal Top Nav (w-full) -->
    <aside 
      class="flex-shrink-0 bg-gray-50 border-gray-200 flex flex-col transition-all duration-300 ease-in-out"
      :class="[
        // Mobile/Tablet styles (< lg)
        'w-full border-b',
        // Desktop styles (>= lg)
        'lg:h-full lg:border-r lg:border-b-0',
        sidebarWidthClass
      ]"
    >
      <div 
        class="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto"
        :class="{'flex flex-row lg:flex-col': true}"
      >
        <slot name="sidebar"></slot>
      </div>
    </aside>

    <!-- Content / Detail View -->
    <main class="flex-1 overflow-y-auto bg-white min-w-0">
      <slot name="content"></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  sidebarWidth: {
    type: String,
    default: 'w-56', // Default to 14rem (56)
    validator: (value: string) => ['w-56', 'w-64', 'w-72', 'w-80'].includes(value)
  }
});

const sidebarWidthClass = computed(() => {
  // Use a lookup object to ensure Tailwind JIT detects the complete class names
  const widthClasses: Record<string, string> = {
    'w-56': 'lg:w-56',
    'w-64': 'lg:w-64',
    'w-72': 'lg:w-72',
    'w-80': 'lg:w-80'
  };
  return widthClasses[props.sidebarWidth] || 'lg:w-56';
});
</script>

<style scoped>
/* 
  Custom scrollbar styling for the horizontal scroll on mobile 
  if we want to hide it or style it. For now, native is fine.
*/
</style>
