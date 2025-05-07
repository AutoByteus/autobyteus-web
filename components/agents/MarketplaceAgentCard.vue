<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
    <div class="p-6">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-lg font-medium text-indigo-600">{{ agent.name }}</h3>
          <p class="text-sm text-gray-500">by {{ agent.author }}</p>
        </div>
        <span :class="['px-2 py-1 text-xs font-medium rounded-full', executionTypeColor]">
          {{ agent.executionType }}
        </span>
      </div>
      
      <p class="text-gray-600 mb-4 text-sm">{{ agent.description }}</p>
      
      <div class="flex items-center mb-4">
        <div class="flex text-yellow-400">
          <svg v-for="n in 5" :key="n" class="h-4 w-4" :class="n <= Math.floor(agent.rating) ? 'text-yellow-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <span class="ml-2 text-sm text-gray-600">{{ agent.rating }} ({{ formatDownloads(agent.downloads) }})</span>
      </div>
      
      <div class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="skill in agent.skills.slice(0, 3)"
          :key="skill"
          class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
        >
          {{ skill }}
        </span>
        <span v-if="agent.skills.length > 3" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
          +{{ agent.skills.length - 3 }} more
        </span>
      </div>
      
      <div class="flex justify-between items-center border-t border-gray-100 pt-4">
        <div>
          <p class="text-lg font-bold text-gray-900">{{ priceDisplay }}</p>
          <p class="text-sm text-gray-500">{{ priceType }}</p>
        </div>
        <button 
          @click="$emit('select', agent.id)"
          class="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
        >
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MarketplaceAgent } from '~/stores/agents';

const props = defineProps({
  agent: {
    type: Object as () => MarketplaceAgent,
    required: true
  }
});

const emit = defineEmits(['select']);

const executionTypeColor = computed(() => {
  switch (props.agent.executionType) {
    case 'LOCAL':
      return 'bg-green-100 text-green-800';
    case 'P2P':
      return 'bg-blue-100 text-blue-800';
    case 'BOTH':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

const priceDisplay = computed(() => {
  if (props.agent.price === 0) {
    return 'Free';
  }
  return `$${props.agent.price}`;
});

const priceType = computed(() => {
  switch (props.agent.priceType) {
    case 'one-time':
      return 'One-time purchase';
    case 'monthly':
      return 'Monthly subscription';
    case 'yearly':
      return 'Yearly subscription';
    case 'usage-based':
      return 'Usage-based pricing';
    default:
      return '';
  }
});

function formatDownloads(downloads: number): string {
  if (downloads < 1000) return downloads.toString();
  if (downloads < 10000) return `${(downloads / 1000).toFixed(1)}k`;
  return `${Math.floor(downloads / 1000)}k`;
}
</script>
