<template>
    <div>
      <button @click="toggleCollapse">
        <span v-if="isCollapsed">▼</span>
        <span v-else>▲</span>
      </button>
      <div v-show="!isCollapsed" class="collapsible-content">
        <slot></slot>
      </div>
      <!-- When collapsed, this will hold the peek content -->
      <div v-show="isCollapsed" class="collapsible-peek">
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
  button {
    background-color: #007BFF;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  button:hover {
    background-color: #0056b3;
  }
  
  .collapsible-content, .collapsible-peek {
    transition: opacity 0.3s ease-in-out, max-height 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px;
    opacity: 1;
  }
  
  .collapsible-peek {
    opacity: 0.5; 
    max-height: 70px; 
  }
  
  .collapsible-content[style*="display: none"], .collapsible-peek[style*="display: none"] {
    display: none;
  }
  </style>
  