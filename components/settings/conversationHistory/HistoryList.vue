<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="px-8 pt-8 pb-4 flex justify-between items-start flex-shrink-0">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Conversation History</h2>
        <p class="text-sm text-gray-500 mt-1">Browse and inspect raw conversation logs and agent interactions.</p>
      </div>
      
      <!-- Refresh Icon Button -->
      <button 
        @click="store.fetchRawConversationHistory()" 
        :disabled="store.loading"
        class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6" :class="{'animate-spin': store.loading}">
          <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Unified Filter + Table Container with consistent padding -->
    <div class="flex-1 overflow-auto px-8 pb-8">
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <!-- Filters Bar - integrated into the unified container -->
        <div class="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <!-- Agent Filter -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Agent</label>
            <div class="relative w-56">
              <select 
                v-model="selectedAgentId"
                @change="handleAgentFilterChange"
                class="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
              >
                <option :value="null">All Agents</option>
                <option v-for="agent in agentDefinitionStore.agentDefinitions" :key="agent.id" :value="agent.id">
                  {{ agent.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Search Input -->
          <div class="flex flex-col gap-1 flex-grow">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Search Content</label>
            <div class="relative max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="i-heroicons-magnifying-glass-20-solid text-gray-400 w-5 h-5"></span>
              </div>
              <input 
                v-model="searchInput"
                @keyup.enter="handleSearch"
                type="text" 
                placeholder="Search by ID, content, or context..." 
                class="block w-full pl-10 pr-10 py-2 border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
              >
              <button 
                v-if="searchInput"
                @click="handleClearSearch"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span class="i-heroicons-x-mark-20-solid w-5 h-5"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Table Content - No horizontal scroll, text wraps -->
        <div v-if="store.loading && store.conversations.length === 0" class="py-20 flex flex-col items-center justify-center text-gray-500 bg-white">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-sm">Loading history...</p>
        </div>

        <div v-else-if="store.conversations.length === 0" class="py-20 flex flex-col items-center justify-center text-gray-400 bg-white">
          <div class="p-4 bg-gray-50 rounded-full mb-4">
            <span class="i-heroicons-inbox-20-solid w-8 h-8 text-gray-300"></span>
          </div>
          <p class="text-lg font-medium text-gray-600">No conversation history found</p>
          <p class="text-sm mt-1">Try adjusting your filters or starting a new conversation.</p>
        </div>
      
        <!-- Table with horizontal scroll enabled -->
        <div v-else class="bg-white overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" style="width: 200px">Agent Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Conversation Preview</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style="width: 100px">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="conv in store.conversations" 
              :key="conv.id" 
              class="group hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
              @click="store.selectConversation(conv.id)"
            >
              <!-- Agent Column -->
              <td class="px-6 py-4 align-top" style="width: 200px">
                <div class="flex items-center">
                  <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mr-3 flex-shrink-0">
                    {{ (conv.agentName || conv.agentDefinitionId || '?').charAt(0).toUpperCase() }}
                  </span>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate" :title="conv.agentName">{{ conv.agentName || 'Unknown Agent' }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ conv.agentDefinitionId }}</div>
                  </div>
                </div>
              </td>
              
              <!-- Preview Column - wraps text instead of scrolling -->
              <td class="px-6 py-4 align-top">
                <div class="text-sm text-gray-600 line-clamp-2 leading-relaxed break-words">
                  {{ getPreviewText(conv) }}
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {{ conv.messages.length }} messages
                  </span>
                  <span v-if="conv.llmModelIdentifier" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 truncate max-w-[150px]" :title="conv.llmModelIdentifier">
                    {{ conv.llmModelIdentifier }}
                  </span>
                </div>
              </td>

              <!-- Action Column -->
              <td class="px-6 py-4 text-right text-sm font-medium align-middle" style="width: 100px">
                <span class="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  View
                  <span class="i-heroicons-chevron-right-20-solid w-4 h-4"></span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

        <!-- Pagination Footer - inside the unified container -->
        <div class="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing page <span class="font-medium">{{ store.currentPage }}</span> of <span class="font-medium">{{ store.totalPages }}</span>
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  @click="store.previousPage()"
                  :disabled="store.isFirstPage || store.loading"
                  class="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button 
                  @click="store.nextPage()"
                  :disabled="store.isLastPage || store.loading"
                  class="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
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
  agentDefinitionStore.fetchAllAgentDefinitions();
  selectedAgentId.value = store.selectedAgentId;
});

const handleSearch = () => {
  store.performSearch(searchInput.value);
};

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
