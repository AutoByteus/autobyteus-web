<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Remote Agents</h1>
        <p class="text-gray-500">Access P2P and remote AI agents</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="$emit('manage-remote')"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span class="i-heroicons-server-20-solid w-5 h-5 mr-2 inline-block"></span>
          Manage Remote Agents
        </button>
        <button
          @click="$emit('add-remote')"
          class="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
        >
          <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2 inline-block"></span>
          Add Remote Agent
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AgentCard 
        v-for="agent in agents" 
        :key="agent.id" 
        :agent="agent"
        @run="$emit('select-agent', agent)"
      />
      <div v-if="agents.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
        <span class="i-heroicons-server-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
        <p class="text-gray-500 mb-2">No Remote Agents configured</p>
        <button
          @click="$emit('add-remote')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
          Add Remote Agent
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import AgentCard from '~/components/agents/AgentCard.vue';

const props = defineProps({
  agents: {
    type: Array,
    required: true
  }
});

defineEmits(['select-agent', 'manage-remote', 'add-remote']);
</script>
