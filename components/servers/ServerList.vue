<template>
  <div class="bg-white shadow-sm rounded-lg overflow-hidden">
    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-800">{{ title }}</h3>
      <button 
        @click="$emit('add')"
        class="p-1 rounded-full text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span class="i-heroicons-plus-circle-20-solid w-6 h-6"></span>
      </button>
    </div>
    
    <div v-if="servers.length === 0" class="p-6 text-center text-gray-500">
      <span v-if="serverType === 'mcp'" class="i-heroicons-server-20-solid w-8 h-8 mx-auto mb-2"></span>
      <span v-else class="i-heroicons-cpu-chip-20-solid w-8 h-8 mx-auto mb-2"></span>
      <p>No {{ serverType === 'mcp' ? 'MCP' : 'Agent' }} servers added yet.</p>
      <button 
        @click="$emit('add')"
        class="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Add your first server
      </button>
    </div>
    
    <ul v-else class="divide-y divide-gray-200">
      <li v-for="server in servers" :key="server.id" class="p-4 hover:bg-gray-50">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium text-gray-900">{{ server.name }}</h4>
            <p class="text-sm text-gray-500 truncate">{{ server.url }}</p>
            <div class="mt-1 flex items-center">
              <span 
                class="inline-block w-2 h-2 rounded-full mr-2"
                :class="server.status === 'connected' ? 'bg-green-500' : 'bg-red-500'"
              ></span>
              <span class="text-xs text-gray-500">
                {{ server.status === 'connected' ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="$emit('edit', server)"
              class="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span class="i-heroicons-pencil-square-20-solid w-5 h-5"></span>
            </button>
            <button 
              @click="$emit('delete', server.id)"
              class="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <span class="i-heroicons-trash-20-solid w-5 h-5"></span>
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  servers: {
    type: Array,
    required: true
  },
  serverType: {
    type: String,
    required: true,
    validator: (value: string) => ['mcp', 'agent'].includes(value)
  },
  title: {
    type: String,
    required: true
  }
});

defineEmits(['add', 'edit', 'delete']);
</script>
