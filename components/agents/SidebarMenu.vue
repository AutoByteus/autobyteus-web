<template>
  <div class="w-64 bg-white shadow-sm overflow-y-auto h-full">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">AI Agents</h2>
      
      <nav class="w-full">
        <ul class="w-full space-y-2">
          <li>
            <button 
              @click="$emit('change-page', 'local-agents')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
              :class="{ 'bg-gray-100 text-gray-900 font-medium': activePage === 'local-agents' }"
            >
              <span class="text-left">Local Agents</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'remote-agents')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
              :class="{ 'bg-gray-100 text-gray-900 font-medium': activePage === 'remote-agents' }"
            >
              <span class="text-left">Remote Agents</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'marketplace')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
              :class="{ 'bg-gray-100 text-gray-900 font-medium': activePage === 'marketplace' }"
            >
              <span class="text-left">Agent Marketplace</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'workflows')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
              :class="{ 'bg-gray-100 text-gray-900 font-medium': activePage === 'workflows' }"
            >
              <span class="text-left">Workflows</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  activePage: {
    type: String,
    required: true
  }
});

defineEmits(['change-page']);
</script>
