<template>
    <div>
      <button @click="toggleCollapse">{{ isCollapsed ? 'Expand' : 'Collapse' }}</button>
      <div v-show="!isCollapsed" class="collapsible-content">
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
  
  <style>
  .collapsible-content {
    transition: opacity 0.3s ease-in-out, max-height 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px; /* or an appropriate value based on your content */
    opacity: 1;
  }
  
  .collapsible-content[style*="display: none"] {
    opacity: 0;
    max-height: 0;
  }
  </style>
  