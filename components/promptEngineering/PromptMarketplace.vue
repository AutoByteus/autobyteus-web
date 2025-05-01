<template>
  <div class="prompt-marketplace">
    <!-- Header with title and sync button -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-800">Prompt Marketplace</h2>
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
    <div v-else-if="prompts.length === 0" class="text-center py-16">
      <div class="text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p class="text-lg font-medium mb-2">No prompts available</p>
        <p class="text-gray-400">Sync to fetch the latest prompts</p>
      </div>
    </div>

    <!-- Prompts By Category - Clean, Simple Layout -->
    <div v-else class="space-y-6">
      <!-- First show prompts without a category (if any) -->
      <div v-if="promptsByCategory['uncategorized']?.length">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Uncategorized</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { usePromptStore } from '~/stores/promptStore';
import PromptCard from '~/components/promptEngineering/PromptCard.vue';

const props = defineProps<{ selectedPromptId: string | null }>();
defineEmits<{ (e: 'select-prompt', id: string): void }>();

const promptStore = usePromptStore();
const { prompts, loading, error, syncing, syncResult, deleteResult } = storeToRefs(promptStore);

const showDeleteConfirm = ref(false);
const promptToDelete = ref<string | null>(null);

// Timers for auto-dismissing notifications
let syncNotificationTimer: number | null = null;
let deleteNotificationTimer: number | null = null;

// Extract unique categories
const uniqueCategories = computed(() => {
  const categories = new Set<string>();
  prompts.value.forEach(prompt => {
    if (prompt.category) {
      categories.add(prompt.category);
    }
  });
  return Array.from(categories).sort();
});

// Group prompts by category
const promptsByCategory = computed(() => {
  const grouped: Record<string, any[]> = {
    uncategorized: []
  };
  
  // Initialize empty arrays for each category
  uniqueCategories.value.forEach(category => {
    grouped[category] = [];
  });
  
  // Group prompts by their category
  prompts.value.forEach(prompt => {
    if (!prompt.category) {
      grouped.uncategorized.push(prompt);
    } else {
      grouped[prompt.category].push(prompt);
    }
  });
  
  return grouped;
});

// Watch for sync result changes
watch(() => promptStore.syncResult, (newVal) => {
  if (newVal?.success) {
    // Auto-dismiss successful sync notifications after 2 seconds
    clearTimeout(syncNotificationTimer as number);
    syncNotificationTimer = window.setTimeout(() => {
      clearSyncResult();
    }, 2000);
  }
});

// Watch for delete result changes
watch(() => promptStore.deleteResult, (newVal) => {
  if (newVal?.success) {
    // Auto-dismiss successful delete notifications after 2 seconds
    clearTimeout(deleteNotificationTimer as number);
    deleteNotificationTimer = window.setTimeout(() => {
      clearDeleteResult();
    }, 2000);
  }
});

// Clean up timers when component is unmounted
onBeforeUnmount(() => {
  if (syncNotificationTimer) clearTimeout(syncNotificationTimer);
  if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
});

onMounted(async () => {
  try {
    await promptStore.fetchActivePrompts();
  } catch (err) {
    console.error('Failed to fetch prompts:', err);
  }
});

async function syncPrompts() {
  try {
    await promptStore.syncPrompts();
  } catch (err) {
    console.error('Failed to sync prompts:', err);
  }
}

function clearSyncResult() {
  if (syncNotificationTimer) {
    clearTimeout(syncNotificationTimer);
    syncNotificationTimer = null;
  }
  promptStore.clearSyncResult();
}

function clearDeleteResult() {
  if (deleteNotificationTimer) {
    clearTimeout(deleteNotificationTimer);
    deleteNotificationTimer = null;
  }
  promptStore.clearDeleteResult();
}

function openDeleteConfirm(id: string) {
  promptToDelete.value = id;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  promptToDelete.value = null;
  showDeleteConfirm.value = false;
}

async function confirmDelete() {
  if (promptToDelete.value) {
    try {
      await promptStore.deletePrompt(promptToDelete.value);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  }
  
  promptToDelete.value = null;
  showDeleteConfirm.value = false;
}
</script>
