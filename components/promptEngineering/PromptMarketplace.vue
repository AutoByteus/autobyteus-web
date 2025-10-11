<template>
  <div class="prompt-marketplace">
    <!-- Header with title, sync button, and other controls -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-800">Prompt Marketplace</h2>
        <div class="flex items-center gap-2">
          <button
            @click="handleReload"
            class="flex items-center px-4 py-2 text-sm rounded-lg transition-colors"
            :class="[
              reloading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            ]"
            :disabled="reloading || syncing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" :class="{'animate-spin': reloading}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ reloading ? 'Reloading...' : 'Reload' }}
          </button>
          <button
            @click="syncPrompts"
            class="flex items-center px-4 py-2 text-sm rounded-lg transition-colors"
            :class="[
              syncing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            ]"
            :disabled="syncing || loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" :class="{'animate-spin': syncing}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ syncing ? 'Syncing...' : 'Sync Prompts' }}
          </button>
          <button
            @click="viewStore.showCreatePromptView"
            class="flex items-center px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Prompt
          </button>
        </div>
      </div>
      
      <!-- Filter and Group Controls -->
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search Input -->
        <div class="relative flex-grow" style="min-width: 200px;">
          <label for="prompt-search" class="block text-sm font-medium text-gray-700 mb-1">Search Prompts</label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              id="prompt-search"
              v-model="searchQuery"
              type="text"
              class="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search name, category, content..."
            />
          </div>
        </div>
        
        <!-- Category Filter Dropdown -->
        <div class="relative min-w-[200px]">
          <label for="categoryFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
          <select
            id="categoryFilter"
            v-model="selectedCategoryFilter"
            class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option v-for="category in uniqueCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <!-- Grouping Options -->
        <div class="relative min-w-[200px]">
          <label for="groupingOption" class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
          <select
            id="groupingOption"
            v-model="groupingOption"
            class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="nameAndCategory">Group by Name & Category</option>
            <option value="category">Group by Category</option>
          </select>
        </div>
        
        <!-- View Toggle -->
        <div class="relative">
          <label class="block text-sm font-medium text-gray-700 mb-1">View</label>
          <div class="flex border border-gray-300 rounded-md overflow-hidden">
            <button 
              @click="viewMode = 'grid'"
              class="px-3 py-2 flex items-center"
              :class="viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              @click="viewMode = 'compact'"
              class="px-3 py-2 flex items-center"
              :class="viewMode === 'compact' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sync Result Message -->
    <div v-if="syncResult" class="mb-6">
      <div 
        class="p-4 rounded-lg" 
        :class="syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg v-if="syncResult.success" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ syncResult.message }}</p>
            <p v-if="syncResult.success" class="mt-1 text-sm">
              {{ syncResult.syncedCount }} prompts synchronized 
              ({{ syncResult.initialCount }} → {{ syncResult.finalCount }})
            </p>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button 
                @click="clearSyncResult"
                class="inline-flex bg-transparent rounded-md p-1.5"
                :class="syncResult.success ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'"
              >
                <span class="sr-only">Dismiss</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Result Message -->
    <div v-if="deleteResult" class="mb-6">
      <div 
        class="p-4 rounded-lg" 
        :class="deleteResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg v-if="deleteResult.success" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ deleteResult.message }}</p>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button 
                @click="clearDeleteResult"
                class="inline-flex bg-transparent rounded-md p-1.5"
                :class="deleteResult.success ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'"
              >
                <span class="sr-only">Dismiss</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Delete Prompt</h3>
        <p class="text-gray-700 mb-6">Are you sure you want to delete this prompt? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="confirmDelete" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading || syncing" class="grid place-items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPrompts.length === 0" class="text-center py-16">
      <div class="text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p class="text-lg font-medium mb-2">No prompts found</p>
        <p class="text-gray-400">
          {{ prompts.length === 0 ? "Sync to fetch the latest prompts" : "Try changing your filter settings" }}
        </p>
      </div>
    </div>

    <!-- Group by Category View -->
    <div v-else-if="groupingOption === 'category'" class="space-y-6">
      <div v-if="promptsByCategory['Uncategorized']?.length">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Uncategorized</h3>
        <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
          <PromptCard
            v-for="prompt in promptsByCategory['Uncategorized']"
            :key="prompt.id"
            :prompt="prompt"
            :isSelected="selectedPromptId === prompt.id"
            :showDeleteButton="true"
            @select="viewStore.showPromptDetails(prompt.id)"
            @delete="openDeleteConfirm(prompt.id)"
          />
        </div>
      </div>
      
      <div 
        v-for="category in Object.keys(promptsByCategory).filter(c => c !== 'Uncategorized')" 
        :key="category"
        class="pt-2"
      >
        <h3 class="text-lg font-medium text-gray-800 mb-4 pb-2 border-b">{{ category }}</h3>
        <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
          <PromptCard
            v-for="prompt in promptsByCategory[category]"
            :key="prompt.id"
            :prompt="prompt"
            :isSelected="selectedPromptId === prompt.id"
            :showDeleteButton="true"
            @select="viewStore.showPromptDetails(prompt.id)"
            @delete="openDeleteConfirm(prompt.id)"
          />
        </div>
      </div>
    </div>

    <!-- Group by Name & Category View -->
    <div v-else class="space-y-8">
      <div 
        v-for="(promptGroup, groupKey) in promptsByNameAndCategory" 
        :key="groupKey"
        class="bg-white rounded-lg p-4 border"
      >
        <!-- Group header -->
        <div class="border-b pb-3 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">{{ promptGroup[0].name }}</h3>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                {{ promptGroup[0].category || 'Uncategorized' }}
              </span>
            </div>
          </div>
          <p v-if="promptGroup[0].description" class="text-sm text-gray-600 mt-2">
            {{ promptGroup[0].description }}
          </p>
        </div>

        <!-- Group prompts (showing only latest version) -->
        <div v-if="promptGroup.length > 0">
          <div
            class="transition-opacity"
            :class="{ 'opacity-70 hover:opacity-100': !promptGroup[0].isActive }"
          >
            <PromptCard
              :prompt="promptGroup[0]"
              :isSelected="selectedPromptId === promptGroup[0].id"
              :showDeleteButton="true"
              @select="viewStore.showPromptDetails(promptGroup[0].id)"
              @delete="openDeleteConfirm(promptGroup[0].id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { usePromptStore } from '~/stores/promptStore';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';
import PromptCard from '~/components/promptEngineering/PromptCard.vue';

interface Prompt {
  id: string;
  name: string;
  category: string;
  promptContent: string;
  description?: string | null;
  suitableForModels?: string | null;
  version: number;
  createdAt: string;
  parentPromptId?: string | null;
  isActive: boolean;
}


defineProps<{ selectedPromptId: string | null }>();
defineEmits<{ (e: 'select-prompt', id: string): void }>();

const promptStore = usePromptStore();
const viewStore = usePromptEngineeringViewStore();
const { prompts, loading, error, syncing, syncResult, deleteResult } = storeToRefs(promptStore);

// Search and filter state
const searchQuery = ref('');
const selectedCategoryFilter = ref('');

// Local loading state for the reload button
const reloading = ref(false);

// Base UI state
const showDeleteConfirm = ref(false);
const promptToDelete = ref<string | null>(null);
const groupingOption = ref('nameAndCategory'); // Default to Name & Category grouping
const viewMode = ref('grid'); // 'grid' or 'compact'

// Timers for auto-dismissing notifications
let syncNotificationTimer: number | null = null;
let deleteNotificationTimer: number | null = null;

// NEW: Computed property to get only the latest version of each prompt
const latestVersionPrompts = computed(() => {
  const latestPromptsMap = new Map<string, Prompt>();

  prompts.value.forEach(prompt => {
    const key = `${prompt.name}::${prompt.category || 'Uncategorized'}`;
    const existing = latestPromptsMap.get(key);

    if (!existing || prompt.version > existing.version) {
      latestPromptsMap.set(key, prompt);
    }
  });

  return Array.from(latestPromptsMap.values());
});

// Filter prompts based on category and search query
const filteredPrompts = computed(() => {
  let filtered = latestVersionPrompts.value; // Use latest versions as the source

  // Filter by category
  if (selectedCategoryFilter.value) {
    if (selectedCategoryFilter.value === 'Uncategorized') {
      filtered = filtered.filter(p => !p.category);
    } else {
      filtered = filtered.filter(p => p.category === selectedCategoryFilter.value);
    }
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const lowerCaseQuery = searchQuery.value.trim().toLowerCase();
    filtered = filtered.filter(prompt => {
      const inName = prompt.name.toLowerCase().includes(lowerCaseQuery);
      const inDescription = prompt.description?.toLowerCase().includes(lowerCaseQuery) || false;
      const inContent = prompt.promptContent.toLowerCase().includes(lowerCaseQuery);
      const inCategory = prompt.category?.toLowerCase().includes(lowerCaseQuery) || false;
      return inName || inDescription || inContent || inCategory;
    });
  }
  
  return filtered;
});

// Extract unique categories from all prompts (not just filtered) for the dropdown
const uniqueCategories = computed(() => {
  const categories = new Set<string>();
  prompts.value.forEach(prompt => {
    const category = prompt.category || 'Uncategorized';
    categories.add(category);
  });
  const sorted = Array.from(categories).sort();
  // Ensure 'Uncategorized' is at the end if it exists
  if (sorted.includes('Uncategorized')) {
    return [...sorted.filter(c => c !== 'Uncategorized'), 'Uncategorized'];
  }
  return sorted;
});

// Group filtered prompts by category
const promptsByCategory = computed(() => {
  const grouped: Record<string, any[]> = {};
  
  filteredPrompts.value.forEach(prompt => {
    const categoryKey = prompt.category || 'Uncategorized';
    if (!grouped[categoryKey]) {
      grouped[categoryKey] = [];
    }
    grouped[categoryKey].push(prompt);
  });
  
  // Sort categories
  const sortedGrouped: Record<string, any[]> = {};
  Object.keys(grouped).sort((a,b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    }).forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

  return sortedGrouped;
});


// Group prompts by name and category for the alternative view
const promptsByNameAndCategory = computed(() => {
  const grouped: Record<string, any[]> = {};
  filteredPrompts.value.forEach(prompt => {
    const key = `${prompt.name}::${prompt.category || 'Uncategorized'}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(prompt);
  });
  return grouped;
});

// Functions
const handleReload = async () => {
  reloading.value = true;
  try {
    await promptStore.reloadPrompts();
  } catch(e) {
    console.error("Failed to reload prompts:", e);
  } finally {
    reloading.value = false;
  }
};

const syncPrompts = async () => {
  await promptStore.syncPrompts();
  if (syncResult.value) {
    // Auto-dismiss after 5 seconds
    if (syncNotificationTimer) clearTimeout(syncNotificationTimer);
    syncNotificationTimer = window.setTimeout(() => {
      promptStore.clearSyncResult();
    }, 5000);
  }
};

const clearSyncResult = () => {
  if (syncNotificationTimer) clearTimeout(syncNotificationTimer);
  promptStore.clearSyncResult();
};

const openDeleteConfirm = (id: string) => {
  promptToDelete.value = id;
  showDeleteConfirm.value = true;
};

const cancelDelete = () => {
  promptToDelete.value = null;
  showDeleteConfirm.value = false;
};

const confirmDelete = async () => {
  if (promptToDelete.value) {
    await promptStore.deletePrompt(promptToDelete.value);
    if (deleteResult.value) {
      // Auto-dismiss after 5 seconds
      if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
      deleteNotificationTimer = window.setTimeout(() => {
        promptStore.clearDeleteResult();
      }, 5000);
    }
  }
  cancelDelete();
};

const clearDeleteResult = () => {
  if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
  promptStore.clearDeleteResult();
};

onMounted(() => {
  // Always fetch all prompts on mount
  promptStore.fetchPrompts(null);
});

onBeforeUnmount(() => {
  if (syncNotificationTimer) clearTimeout(syncNotificationTimer);
  if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
});
</script>

<style scoped>
.prompt-marketplace {
  padding: 2rem;
}
</style>
