<template>
  <div class="create-prompt-view bg-white rounded-lg border p-6 h-full flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 pb-4 border-b">
      <div class="flex items-center">
        <button
          @click="handleClose"
          class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </button>
      </div>
      <h1 class="text-xl font-semibold text-gray-800">Create New Prompt</h1>
    </div>

    <!-- Form -->
    <div class="flex-grow overflow-auto pr-2">
      <form @submit.prevent="submitPrompt" class="space-y-6">
        <!-- Prompt Name -->
        <div>
          <label for="prompt-name" class="block text-sm font-medium text-gray-700">Prompt Name</label>
          <input
            id="prompt-name"
            v-model="formData.name"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Python Code Generator"
          />
        </div>

        <!-- Category -->
        <div>
          <label for="prompt-category" class="block text-sm font-medium text-gray-700">Category</label>
          <input
            id="prompt-category"
            v-model="formData.category"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Code Generation"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="prompt-description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="prompt-description"
            v-model="formData.description"
            rows="3"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="A short description of what this prompt is for."
          ></textarea>
        </div>

        <!-- Suitable for Models (Multi-select) -->
        <CanonicalModelSelector v-model="formData.suitableForModels" />

        <!-- Prompt Content -->
        <div class="flex-grow flex flex-col">
          <label for="prompt-content" class="block text-sm font-medium text-gray-700">Prompt Content</label>
          <textarea
            id="prompt-content"
            v-model="formData.promptContent"
            required
            class="mt-1 block w-full flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            placeholder="Enter your prompt here..."
            style="min-height: 200px;"
          ></textarea>
        </div>
      </form>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-4 border-t flex justify-end gap-3">
      <button
        @click="handleClose"
        type="button"
        class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        @click="submitPrompt"
        type="submit"
        :disabled="isSubmitting || !isFormValid"
        class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
      >
        {{ isSubmitting ? 'Creating...' : 'Create Prompt' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { usePromptStore } from '~/stores/promptStore';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';
import CanonicalModelSelector from './CanonicalModelSelector.vue';

const promptStore = usePromptStore();
const viewStore = usePromptEngineeringViewStore();

const formData = reactive({
  name: '',
  category: '',
  description: '',
  suitableForModels: [] as string[],
  promptContent: '',
});

const isSubmitting = ref(false);

const isFormValid = computed(() => {
  return formData.name.trim() !== '' && formData.category.trim() !== '' && formData.promptContent.trim() !== '';
});

async function submitPrompt() {
  if (!isFormValid.value || isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const newPrompt = await promptStore.createPrompt(
      formData.name,
      formData.category,
      formData.promptContent,
      formData.description,
      formData.suitableForModels.join(', ')
    );
    
    // On success, navigate to the prompt details of the newly created prompt
    if (newPrompt && newPrompt.id) {
      viewStore.showPromptDetails(newPrompt.id);
    } else {
      // Fallback to marketplace if for some reason we don't get an ID
      viewStore.showMarketplace();
    }
  } catch (err) {
    // Error will be handled by the store, maybe show a notification here in the future
    console.error("Failed to create prompt:", err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  viewStore.showMarketplace();
}
</script>
