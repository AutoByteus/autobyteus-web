<template>
  <div class="prompt-marketplace p-6 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-semibold mb-4">Prompts Marketplace</h2>
    <div v-if="loading" class="text-center py-4">Loading prompts...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else>
      <div v-if="prompts.length === 0" class="text-gray-600">No prompts available.</div>
      <ul v-else>
        <li 
          v-for="prompt in prompts" 
          :key="prompt.id" 
          class="border-b py-2 cursor-pointer hover:bg-gray-50"
          @click="openPromptDetails(prompt)"
        >
          <h3 class="text-xl font-medium">{{ prompt.name }}</h3>
          <p class="text-sm text-gray-500">{{ prompt.category }}</p>
          <p class="mt-1 text-gray-700 truncate">{{ prompt.promptText }}</p>
        </li>
      </ul>
    </div>

    <!-- Prompt Details Modal -->
    <div 
      v-if="selectedPrompt" 
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closePromptDetails"
    >
      <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-1/2 max-h-[80vh] overflow-y-auto">
        <h3 class="text-2xl font-semibold mb-4">{{ selectedPrompt.name }}</h3>
        <p class="text-sm text-gray-500 mb-2">Category: {{ selectedPrompt.category }}</p>
        <p class="text-gray-700 mb-4 whitespace-pre-wrap">{{ selectedPrompt.promptText }}</p>
        <div v-if="selectedPrompt.parentPromptId" class="mb-4">
          <button 
            @click="toggleParentPrompt" 
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {{ showParent ? 'Hide Parent Prompt' : 'Show Parent Prompt' }}
          </button>
          <div v-if="showParent && parentPrompt" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-lg font-medium">Parent Prompt: {{ parentPrompt.name }}</h4>
            <p class="text-sm text-gray-500">Category: {{ parentPrompt.category }}</p>
            <p class="text-gray-700 whitespace-pre-wrap">{{ parentPrompt.promptText }}</p>
          </div>
          <div v-else-if="showParent && parentLoading" class="mt-4 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div v-else-if="showParent && parentError" class="mt-4 text-red-500">
            {{ parentError }}
          </div>
        </div>
        <div class="flex justify-end">
          <button 
            @click="closePromptDetails" 
            class="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePromptStore } from '~/stores/promptStore';

const promptStore = usePromptStore();
const { prompts, loading, error, fetchActivePrompts } = promptStore;

const selectedPrompt = ref<any>(null);
const showParent = ref(false);
const parentPrompt = ref<any>(null);
const parentLoading = ref(false);
const parentError = ref('');

onMounted(() => {
  fetchActivePrompts();
});

const openPromptDetails = (prompt: any) => {
  selectedPrompt.value = prompt;
  showParent.value = false;
  parentPrompt.value = null;
  parentError.value = '';
};

const closePromptDetails = () => {
  selectedPrompt.value = null;
  showParent.value = false;
  parentPrompt.value = null;
  parentError.value = '';
};

const toggleParentPrompt = async () => {
  showParent.value = !showParent.value;
  if (showParent.value && selectedPrompt.value?.parentPromptId && !parentPrompt.value) {
    parentLoading.value = true;
    try {
      const prompt = await promptStore.fetchPromptById(selectedPrompt.value.parentPromptId);
      if (prompt) {
        parentPrompt.value = prompt;
      } else {
        parentError.value = 'Parent prompt not found.';
      }
    } catch (e) {
      parentError.value = 'Failed to load parent prompt.';
    } finally {
      parentLoading.value = false;
    }
  }
};
</script>

<style scoped>
.prompt-marketplace {
  max-height: 80vh;
  overflow-y: auto;
}

.modal-overlay {
  backdrop-filter: blur(2px);
}

.truncate {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
