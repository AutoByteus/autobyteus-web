<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Local Agents</h1>
        <p class="text-gray-500">Access your installed local AI agents</p>
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
        <span class="i-heroicons-face-frown-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
        <p class="text-gray-500">No local agents available</p>
        <p class="text-gray-500 mt-2">Install agents from the marketplace to get started</p>
        <button
          @click="$emit('go-to-marketplace')"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <span class="i-heroicons-shopping-bag-20-solid w-4 h-4 mr-1"></span>
          Browse Marketplace
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

defineEmits(['select-agent', 'go-to-marketplace']);
</script>
