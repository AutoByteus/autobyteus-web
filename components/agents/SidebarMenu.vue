<template>
  <div class="w-64 bg-white shadow-sm overflow-y-auto h-full border-r border-gray-200">
    <div class="p-4"> 
      <h2 class="text-xl font-semibold text-gray-800 mb-6 px-2">AI Agents</h2> 
      
      <nav class="w-full">
        <ul class="w-full space-y-1"> 
          <li>
            <button 
              @click="$emit('change-page', 'launch-profiles')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-150 ease-in-out"
              :class="activePage === 'launch-profiles' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'"
            >
              <span class="text-left font-medium">Launch Profiles</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'local-agents')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-150 ease-in-out"
              :class="activePage === 'local-agents' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'"
            >
              <span class="text-left font-medium">Local Agents</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'remote-agents')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-150 ease-in-out"
              :class="activePage === 'remote-agents' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'"
            >
              <span class="text-left font-medium">Remote Agents</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'marketplace')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-150 ease-in-out"
              :class="activePage === 'marketplace' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'"
            >
              <span class="text-left font-medium">Agent Marketplace</span>
            </button>
          </li>
          <li>
            <button 
              @click="$emit('change-page', 'workflows')"
              class="flex w-full items-center justify-start px-4 py-3 rounded-md transition-colors duration-150 ease-in-out"
              :class="activePage === 'workflows' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'"
            >
              <span class="text-left font-medium">Workflows</span>
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
