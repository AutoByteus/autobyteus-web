<template>
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex justify-between items-center mb-8">
        <button 
          @click="$emit('close')"
          class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </button>
      </div>

      <div v-if="loading" class="animate-pulse space-y-8">
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        <div class="space-y-4">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="error" class="text-red-500 text-center py-8">
        {{ error }}
      </div>

      <div v-else-if="prompt" class="space-y-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ prompt.name }}</h1>
          <span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {{ prompt.category }}
          </span>
        </div>

        <div class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p class="text-gray-700">{{ prompt.description || '—' }}</p>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Suitable for Model</h2>
            <p class="text-gray-700">{{ prompt.suitableForModel || '—' }}</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Prompt Content</h2>
          <div class="prose max-w-none">
            <pre class="whitespace-pre-wrap text-gray-700 font-mono bg-white p-6 rounded-lg border">{{ prompt.promptContent }}</pre>
          </div>
        </div>

        <div class="flex justify-end space-x-4">
          <button 
            @click="copyPrompt"
            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Copy Prompt
          </button>
          <button 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use This Prompt
          </button>
        </div>

        <div v-if="prompt.parentPromptId" class="border-t pt-8 mt-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Parent Prompt</h2>
            <button 
              @click="toggleParentPrompt"
              class="text-blue-600 hover:text-blue-700"
            >
              {{ showParent ? 'Hide Parent' : 'Show Parent' }}
            </button>
          </div>

          <div v-if="showParent">
            <div v-if="parentLoading" class="animate-pulse space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            
            <div v-else-if="parentPrompt" class="bg-gray-50 rounded-lg p-6">
              <h3 class="font-medium text-gray-900 mb-2">{{ parentPrompt.name }}</h3>
              <pre class="whitespace-pre-wrap text-gray-700 font-mono bg-white p-4 rounded border">{{ parentPrompt.promptContent }}</pre>
            </div>
            
            <div v-else-if="parentError" class="text-red-500">
              {{ parentError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { usePromptStore } from '~/stores/promptStore';

const props = defineProps<{ promptId: string }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const promptStore = usePromptStore();
const prompt = ref<any>(null);
const loading = ref(true);
const error = ref('');

const showParent = ref(false);
const parentPrompt = ref<any>(null);
const parentLoading = ref(false);
const parentError = ref('');

const loadPrompt = async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await promptStore.fetchPromptById(props.promptId);
    prompt.value = result;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const toggleParentPrompt = async () => {
  showParent.value = !showParent.value;
  if (showParent.value && prompt.value?.parentPromptId && !parentPrompt.value) {
    parentLoading.value = true;
    try {
      const result = await promptStore.fetchPromptById(prompt.value.parentPromptId);
      parentPrompt.value = result;
    } catch (e: any) {
      parentError.value = e.message;
    } finally {
      parentLoading.value = false;
    }
  }
};

const copyPrompt = () => {
  if (prompt.value?.promptContent) {
    navigator.clipboard.writeText(prompt.value.promptContent)
      .catch(err => console.error('Failed to copy prompt:', err));
  }
};

watch(() => props.promptId, loadPrompt, { immediate: true });
</script>
