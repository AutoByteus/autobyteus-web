<template>
  <div class="prompt-marketplace">
    <!-- Prompt Comparison View (Modal) -->
    <PromptCompare
      v-if="comparisonMode"
      :promptIds="selectedPromptsForComparison"
      :promptCategory="comparisonCategory"
      :promptName="comparisonName"
      @close="exitComparisonMode"
    />

    <!-- Header with title, sync button, and model filter -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-800">Prompt Marketplace</h2>
        <div class="flex items-center gap-2">
          <button
            @click="syncPrompts"
            class="flex items-center px-4 py-2 text-sm rounded-lg transition-colors"
            :class="[
              syncing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            ]"
            :disabled="syncing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <!-- Model Filter Dropdown -->
        <div class="relative min-w-[200px]">
          <label for="modelFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Model</label>
          <select
            id="modelFilter"
            v-model="selectedModelFilter"
            class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Models</option>
            <option v-for="model in availableModels" :key="model" :value="model">
              {{ model }}
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
            <option value="category">Group by Category</option>
            <option value="nameAndCategory">Group by Name & Category</option>
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
      <!-- First show prompts without a category (if any) -->
      <div v-if="promptsByCategory['uncategorized']?.length">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Uncategorized</h3>
        <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
          <PromptCard
            v-for="prompt in promptsByCategory['uncategorized']"
            :key="prompt.id"
            :prompt="prompt"
            :isSelected="selectedPromptId === prompt.id"
            :showDeleteButton="true"
            @select="$emit('select-prompt', prompt.id)"
            @delete="openDeleteConfirm(prompt.id)"
          />
        </div>
      </div>
      
      <!-- Then show each category and its prompts -->
      <div 
        v-for="category in uniqueCategories" 
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
            @select="$emit('select-prompt', prompt.id)"
            @delete="openDeleteConfirm(prompt.id)"
          />
        </div>
      </div>
    </div>

    <!-- Group by Name & Category View with Compare feature -->
    <div v-else class="space-y-8">
      <div 
        v-for="(promptGroup, groupKey) in promptsByNameAndCategory" 
        :key="groupKey"
        class="bg-white rounded-lg p-4 border"
      >
        <!-- Group header with name, category, and comparison button -->
        <div class="border-b pb-3 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">{{ promptGroup[0].name }}</h3>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                {{ promptGroup[0].category }}
              </span>
              <!-- Only show compare button if there are multiple prompts in the group -->
              <button 
                v-if="promptGroup.length > 1" 
                @click="startCompareMode(promptGroup)"
                class="flex items-center px-3 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Compare Versions
              </button>
            </div>
          </div>
          <p v-if="promptGroup[0].description" class="text-sm text-gray-600 mt-2">
            {{ promptGroup[0].description }}
          </p>
          
          <!-- Selection mode UI when in comparison selection -->
          <div v-if="isSelectingForComparison && currentComparisonGroup === groupKey" class="mt-4 bg-blue-50 p-3 rounded">
            <div class="flex justify-between items-center">
              <p class="text-sm text-blue-700">
                <span class="font-medium">Select prompts to compare:</span> 
                {{ selectedPromptsForComparison.length }} selected
              </p>
              <div class="flex gap-2">
                <button 
                  @click="cancelComparisonSelection"
                  class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  @click="confirmComparisonSelection"
                  :disabled="selectedPromptsForComparison.length < 2"
                  :class="[
                    'px-3 py-1 text-sm rounded',
                    selectedPromptsForComparison.length < 2 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  ]"
                >
                  Compare Selected
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Group prompts with comparison selection -->
        <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'">
          <div
            v-for="prompt in promptGroup"
            :key="prompt.id"
            class="relative"
          >
            <!-- Selection checkbox overlay when in comparison mode -->
            <div 
              v-if="isSelectingForComparison && currentComparisonGroup === groupKey"
              class="absolute top-4 left-4 z-10"
            >
              <input 
                type="checkbox" 
                :id="`compare-${prompt.id}`"
                :value="prompt.id"
                v-model="selectedPromptsForComparison"
                class="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>
            
            <!-- Regular prompt card -->
            <PromptCard
              :prompt="prompt"
              :isSelected="selectedPromptId === prompt.id"
              :showDeleteButton="!isSelectingForComparison"
              @select="isSelectingForComparison ? togglePromptSelection(prompt.id) : $emit('select-prompt', prompt.id)"
              @delete="openDeleteConfirm(prompt.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { usePromptStore } from '~/stores/promptStore';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import PromptCard from '~/components/promptEngineering/PromptCard.vue';
import PromptCompare from '~/components/promptEngineering/PromptCompare.vue';

const props = defineProps<{ selectedPromptId: string | null }>();
defineEmits<{ (e: 'select-prompt', id: string): void }>();

const promptStore = usePromptStore();
const viewStore = usePromptEngineeringViewStore();
const llmStore = useLLMProviderConfigStore();
const { prompts, loading, error, syncing, syncResult, deleteResult } = storeToRefs(promptStore);
const { canonicalModels: availableModels } = storeToRefs(llmStore);

// Base UI state
const showDeleteConfirm = ref(false);
const promptToDelete = ref<string | null>(null);
const selectedModelFilter = ref('');
const groupingOption = ref('category'); // Default to Category grouping
const viewMode = ref('grid'); // 'grid' or 'compact'

// Comparison mode state
const comparisonMode = ref(false);
const isSelectingForComparison = ref(false);
const currentComparisonGroup = ref('');
const selectedPromptsForComparison = ref<string[]>([]);
const comparisonCategory = ref('');
const comparisonName = ref('');

// Timers for auto-dismissing notifications
let syncNotificationTimer: number | null = null;
let deleteNotificationTimer: number | null = null;

// Filter prompts based on model compatibility
const filteredPrompts = computed(() => {
  if (!selectedModelFilter.value) {
    return prompts.value;
  }
  
  return prompts.value.filter(prompt => {
    if (!prompt.suitableForModels) return false;
    const modelList = prompt.suitableForModels.split(',').map(model => model.trim());
    return modelList.includes(selectedModelFilter.value);
  });
});

// Extract unique categories from filtered prompts
const uniqueCategories = computed(() => {
  const categories = new Set<string>();
  filteredPrompts.value.forEach(prompt => {
    if (prompt.category) {
      categories.add(prompt.category);
    }
  });
  return Array.from(categories).sort();
});

// Group filtered prompts by category
const promptsByCategory = computed(() => {
  const grouped: Record<string, any[]> = {
    uncategorized: []
  };
  
  // Initialize empty arrays for each category
  uniqueCategories.value.forEach(category => {
    grouped[category] = [];
  });
  
  // Group prompts by their category
  filteredPrompts.value.forEach(prompt => {
    if (!prompt.category) {
      grouped.uncategorized.push(prompt);
    } else {
      grouped[prompt.category].push(prompt);
    }
  });
  
  return grouped;
});

// Group prompts by name and category for the alternative view
const promptsByNameAndCategory = computed(() => {
  const grouped: Record<string, any[]> = {};
  filteredPrompts.value.forEach(prompt => {
    const key = `${prompt.name}::${prompt.category}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(prompt);
  });
  // Sort prompts within each group by version descending
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => b.version - a.version);
  });
  return grouped;
});

// Functions
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

// Comparison Mode Functions
const startCompareMode = (promptGroup: any[]) => {
  isSelectingForComparison.value = true;
  currentComparisonGroup.value = `${promptGroup[0].name}::${promptGroup[0].category}`;
  selectedPromptsForComparison.value = [];
};

const cancelComparisonSelection = () => {
  isSelectingForComparison.value = false;
  currentComparisonGroup.value = '';
  selectedPromptsForComparison.value = [];
};

const confirmComparisonSelection = () => {
  const groupKey = currentComparisonGroup.value;
  const [name, category] = groupKey.split('::');
  comparisonName.value = name;
  comparisonCategory.value = category;
  comparisonMode.value = true;
};

const exitComparisonMode = () => {
  comparisonMode.value = false;
  cancelComparisonSelection();
};

const togglePromptSelection = (id: string) => {
  const index = selectedPromptsForComparison.value.indexOf(id);
  if (index > -1) {
    selectedPromptsForComparison.value.splice(index, 1);
  } else {
    selectedPromptsForComparison.value.push(id);
  }
};

onMounted(() => {
  if (prompts.value.length === 0) {
    promptStore.fetchActivePrompts();
  }
  if (llmStore.providersWithModels.length === 0) {
    llmStore.fetchProvidersWithModels();
  }
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
