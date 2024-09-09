<template>
  <div>
    <button 
      @click="toggleCollapse"
      class="bg-blue-500 text-white px-4 py-2 rounded shadow-md transition duration-300 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <span v-if="isCollapsed">▼</span>
      <span v-else>▲</span>
    </button>
    <div 
      v-show="!isCollapsed" 
      class="transition-all duration-300 ease-in-out max-h-[1000px] opacity-100 overflow-hidden"
    >
      <slot></slot>
    </div>
    <div 
      v-show="isCollapsed" 
      class="transition-all duration-300 ease-in-out max-h-[70px] opacity-50 overflow-hidden"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>