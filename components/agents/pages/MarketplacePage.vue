<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
        <p class="text-gray-500">Browse agents available in the marketplace</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="$emit('sync')"
          class="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
          :disabled="isSyncing"
        >
          <span class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2 inline-block" :class="{ 'animate-spin': isSyncing }"></span>
          {{ isSyncing ? 'Syncing...' : 'Sync Marketplace' }}
        </button>
      </div>
    </div>

    <!-- Enhanced Filter Component -->
    <MarketplaceFilter @filter-change="handleFilterChange" :initial-filters="filters" />

    <!-- P2P Agents -->
    <div v-if="filteredP2PAgents.length > 0" class="mb-8">
      <h2 class="text-lg font-medium text-gray-900 mb-4">P2P Agents</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MarketplaceAgentCard 
          v-for="agent in filteredP2PAgents" 
          :key="agent.id" 
          :agent="agent"
          @select="$emit('select-agent', $event)"
        />
      </div>
    </div>

    <!-- Locally Runnable Agents -->
    <div v-if="filteredLocalAgents.length > 0">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Locally Runnable Agents</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MarketplaceAgentCard 
          v-for="agent in filteredLocalAgents" 
          :key="agent.id" 
          :agent="agent"
          @select="$emit('select-agent', $event)"
        />
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="filteredP2PAgents.length === 0 && filteredLocalAgents.length === 0" class="text-center py-12 bg-white rounded-lg shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900">No agents found</h3>
      <p class="text-gray-500 mt-1">Try adjusting your search or filters</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
import MarketplaceAgentCard from '~/components/agents/MarketplaceAgentCard.vue';
import MarketplaceFilter from '~/components/agents/MarketplaceFilter.vue';
import { useAgentsStore } from '~/stores/agents';

const props = defineProps({
  p2pAgents: {
    type: Array,
    required: true
  },
  localAgents: {
    type: Array,
    required: true
  },
  currentFilter: {
    type: String,
    required: true
  },
  isSyncing: {
    type: Boolean,
    default: false
  }
});

const agentsStore = useAgentsStore();

// Event emitters
defineEmits(['select-agent', 'filter-change', 'sync']);

// Enhanced filter state
const filters = ref({
  executionType: props.currentFilter,
  searchQuery: '',
  category: 'all',
  priceType: 'all'
});

// Filtered agents based on all filters
const filteredP2PAgents = computed(() => {
  // Apply execution type filter
  if (filters.value.executionType !== 'all' && filters.value.executionType !== 'p2p') {
    return [];
  }
  
  return props.p2pAgents.filter(agent => {
    // Apply search filter
    if (filters.value.searchQuery && 
        !agent.name.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) &&
        !agent.description.toLowerCase().includes(filters.value.searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply category filter
    if (filters.value.category !== 'all' && agent.category !== filters.value.category) {
      return false;
    }
    
    // Apply price type filter
    if (filters.value.priceType !== 'all') {
      if (filters.value.priceType === 'free') {
        if (agent.price !== 0) return false;
      } else if (agent.priceType !== filters.value.priceType) {
        return false;
      }
    }
    
    return true;
  });
});

const filteredLocalAgents = computed(() => {
  // Apply execution type filter
  if (filters.value.executionType !== 'all' && filters.value.executionType !== 'local') {
    return [];
  }
  
  return props.localAgents.filter(agent => {
    // Apply search filter
    if (filters.value.searchQuery && 
        !agent.name.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) &&
        !agent.description.toLowerCase().includes(filters.value.searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply category filter
    if (filters.value.category !== 'all' && agent.category !== filters.value.category) {
      return false;
    }
    
    // Apply price type filter
    if (filters.value.priceType !== 'all') {
      if (filters.value.priceType === 'free') {
        if (agent.price !== 0) return false;
      } else if (agent.priceType !== filters.value.priceType) {
        return false;
      }
    }
    
    return true;
  });
});

// Handle filter changes
function handleFilterChange(newFilters) {
  filters.value = newFilters;
  // Emit filter change for parent component
  if (newFilters.executionType !== filters.value.executionType) {
    emit('filter-change', newFilters.executionType);
  }
}
</script>
