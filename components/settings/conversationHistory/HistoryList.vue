<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">History</h2>
        <p class="text-sm text-gray-500 mt-1">View raw conversation logs and system interactions.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Agent Filter Dropdown -->
        <div class="relative w-48">
          <select 
            v-model="selectedAgentId"
            @change="handleAgentFilterChange"
            class="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none bg-white text-gray-700"
          >
            <option :value="null">All Agents</option>
            <option v-for="agent in agentDefinitionStore.agentDefinitions" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
          <span class="i-heroicons-funnel-20-solid absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none"></span>
        </div>

        <!-- Search Input with Clear Button -->
        <div class="relative">
          <input 
            v-model="searchInput"
            @keyup.enter="handleSearch"
            type="text" 
            placeholder="Search history..." 
            class="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-64 shadow-sm"
          >
          <!-- Search Icon (Left) -->
          <span class="i-heroicons-magnifying-glass-20-solid absolute left-3 top-2.5 text-gray-400 w-4 h-4"></span>
          
          <!-- Clear Button (Right) - Only visible when there is text -->
          <button 
            v-if="searchInput"
            @click="handleClearSearch"
            class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            title="Clear search"
          >
            <span class="i-heroicons-x-mark-20-solid w-5 h-5"></span>
          </button>
        </div>

        <!-- Refresh Button ("Round Cycle") -->
        <button 
          @click="store.fetchRawConversationHistory()" 
          class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
          title="Refresh List"
        >
          <span class="i-heroicons-arrow-path-20-solid w-5 h-5" :class="{'animate-spin': store.loading}"></span>
        </button>
      </div>
    </div>

    <!-- Table Content -->
    <div>
      <div v-if="store.loading && store.conversations.length === 0" class="py-12 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="store.conversations.length === 0" class="py-12 flex flex-col items-center justify-center text-gray-500">
        <span class="i-heroicons-document-magnifying-glass-20-solid w-12 h-12 text-gray-300 mb-3"></span>
        <p>No conversation history found.</p>
      </div>
    
      <table v-else class="min-w-full divide-y divide-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">Agent</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic / Preview</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Date</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr 
            v-for="conv in store.conversations" 
            :key="conv.id" 
            class="hover:bg-blue-50/50 transition-colors cursor-pointer group"
            @click="store.selectConversation(conv.id)"
          >
            <!-- 1. Agent Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                {{ conv.agentName || conv.agentDefinitionId }}
              </span>
            </td>
            
            <!-- 2. Topic/Preview Column -->
            <td class="px-6 py-4 text-sm text-gray-500">
              <div class="max-w-xl truncate">{{ getPreviewText(conv) }}</div>
            </td>

            <!-- 3. Date Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 font-medium">{{ formatDateShort(conv.createdAt) }}</div>
              <div class="text-xs text-gray-500">{{ formatTime(conv.createdAt) }}</div>
            </td>

            <!-- 4. Action Column -->
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <span class="text-gray-400 group-hover:text-blue-600">
                <span class="i-heroicons-chevron-right-20-solid w-5 h-5"></span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
      <span class="text-sm text-gray-600">
        Page <span class="font-medium">{{ store.currentPage }}</span> of <span class="font-medium">{{ store.totalPages }}</span>
      </span>
      <div class="flex space-x-2">
        <button 
          @click="store.previousPage()"
          :disabled="store.isFirstPage || store.loading"
          class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button 
          @click="store.nextPage()"
          :disabled="store.isLastPage || store.loading"
          class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRawConversationHistoryStore } from '~/stores/rawConversationHistory';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import type { Conversation } from '~/types/conversation';

const store = useRawConversationHistoryStore();
const agentDefinitionStore = useAgentDefinitionStore();
const searchInput = ref('');
const selectedAgentId = ref<string | null>(null);

onMounted(() => {
  // Ensure we have the list of agents for the dropdown
  agentDefinitionStore.fetchAllAgentDefinitions();
  
  // Update: use new store property selectedAgentId
  selectedAgentId.value = store.selectedAgentId;
});

const handleSearch = () => {
  store.performSearch(searchInput.value);
};

// New function to handle clearing the search
const handleClearSearch = () => {
  searchInput.value = '';
  store.clearSearch();
};

const handleAgentFilterChange = () => {
  store.setSelectedAgentId(selectedAgentId.value);
};

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(date);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const getPreviewText = (conv: Conversation) => {
  if (conv.messages.length === 0) return 'Empty conversation';
  const firstMsg = conv.messages[0];
  return firstMsg.text;
};
</script>
