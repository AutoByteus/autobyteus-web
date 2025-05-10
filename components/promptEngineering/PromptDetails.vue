<template>
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- Header with back button and actions -->
      <div class="flex justify-between items-center mb-6">
        <button
          @click="$emit('close')"
          class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </button>
        
        <div class="flex space-x-3">
          <button
            v-if="prompt"
            @click="copyPrompt"
            class="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Prompt
          </button>
          <button
            v-if="prompt"
            class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Use This Prompt
          </button>
        </div>
      </div>

      <!-- Comparison View -->
      <PromptCompare
        v-if="comparisonMode"
        :promptIds="[promptId, compareWithPromptId]"
        :promptCategory="prompt?.category || ''"
        :promptName="prompt?.name || ''"
        @close="exitComparisonMode"
      />

      <!-- Loading state -->
      <div v-else-if="loading" class="animate-pulse space-y-8">
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        <div class="space-y-4">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-red-500 text-center py-8">
        {{ error }}
      </div>

      <!-- Details content - Single container with improved layout -->
      <div v-else-if="prompt" class="bg-white rounded-lg border p-6">
        <!-- Title and metadata -->
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ prompt.name }}</h1>
        <div class="flex items-center gap-2 mb-6">
          <span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {{ prompt.category }}
          </span>
          <span class="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
            v{{ prompt.version }}
          </span>
          <span class="text-sm text-gray-500">Created {{ formatDate(prompt.createdAt) }}</span>
        </div>

        <!-- Model compatibility badges -->
        <div v-if="prompt.suitableForModels" class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Compatible Models</h2>
          <div class="flex flex-wrap gap-2">
            <ModelBadge
              v-for="model in modelList"
              :key="model"
              :model="model"
            />
          </div>
        </div>

        <!-- Description in a single column layout -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p class="text-gray-700">{{ prompt.description || 'No description provided' }}</p>
        </div>

        <!-- Prompt content -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Prompt Content</h2>
          <pre
            class="whitespace-pre-wrap text-gray-700 font-mono bg-gray-50 p-4 rounded-lg border overflow-auto"
          >{{ prompt.promptContent }}</pre>
        </div>

        <!-- Related prompts section with comparison feature -->
        <div v-if="relatedPrompts.length > 0" class="mt-8 pt-6 border-t">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Related Prompts</h2>
            <p class="text-sm text-gray-500">Same prompt for different models</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="relatedPrompt in relatedPrompts" 
              :key="relatedPrompt.id"
              class="border rounded-lg p-4 hover:shadow-md transition-shadow"
              :class="{ 'bg-blue-50 border-blue-300': relatedPrompt.id === prompt.id }"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-medium">{{ relatedPrompt.name }}</h3>
                  <p class="text-xs text-gray-500">v{{ relatedPrompt.version }}</p>
                </div>
                <div class="flex gap-2">
                  <span 
                    v-if="relatedPrompt.id === prompt.id" 
                    class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                  >
                    Current
                  </span>
                  <button
                    v-else
                    @click="compareWithPrompt(relatedPrompt.id)"
                    class="px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    Compare
                  </button>
                  <button
                    v-if="relatedPrompt.id !== prompt.id"
                    @click="viewRelatedPrompt(relatedPrompt.id)"
                    class="px-2 py-1 text-xs rounded bg-gray-50 text-gray-600 hover:bg-gray-100"
                  >
                    View
                  </button>
                </div>
              </div>
              
              <div v-if="relatedPrompt.suitableForModels" class="mt-2">
                <div class="flex flex-wrap gap-1">
                  <ModelBadge
                    v-for="model in parseModelList(relatedPrompt.suitableForModels)"
                    :key="model"
                    :model="model"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Parent prompt (if exists) -->
        <div v-if="prompt.parentPromptId" class="mt-8 pt-6 border-t">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-gray-900">Parent Prompt</h2>
            <div class="flex gap-2">
              <button @click="toggleParentPrompt" class="text-blue-600 hover:text-blue-700">
                {{ showParent ? 'Hide Parent' : 'Show Parent' }}
              </button>
              <button 
                v-if="parentPrompt" 
                @click="compareWithPrompt(parentPrompt.id)"
                class="text-blue-600 hover:text-blue-700"
              >
                Compare with Parent
              </button>
            </div>
          </div>

          <div v-if="showParent">
            <div v-if="parentLoading" class="animate-pulse space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>

            <div v-else-if="parentPrompt" class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-medium text-gray-900">{{ parentPrompt.name }}</h3>
                <span class="text-xs bg-blue-50 text-blue-700 rounded-full px-2">
                  v{{ parentPrompt.version }}
                </span>
              </div>
              <pre
                class="whitespace-pre-wrap text-gray-700 font-mono bg-white p-4 rounded border"
              >{{ parentPrompt.promptContent }}</pre>
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
import { ref, onMounted, watch, computed } from 'vue';
import { usePromptStore } from '~/stores/promptStore';
import ModelBadge from '~/components/promptEngineering/ModelBadge.vue';
import PromptCompare from '~/components/promptEngineering/PromptCompare.vue';

const props = defineProps<{ promptId: string }>();
const emit = defineEmits<{ 
  (e: 'close'): void;
  (e: 'select-prompt', id: string): void 
}>();

const promptStore = usePromptStore();
const prompt = ref<any>(null);
const loading = ref(true);
const error = ref('');
const relatedPrompts = ref<any[]>([]);

const showParent = ref(false);
const parentPrompt = ref<any>(null);
const parentLoading = ref(false);
const parentError = ref('');

// Comparison mode state
const comparisonMode = ref(false);
const compareWithPromptId = ref('');

// Parse models into a list for display
const modelList = computed(() => {
  if (!prompt.value?.suitableForModels) return [];
  return prompt.value.suitableForModels.split(',').map((model: string) => model.trim());
});

function parseModelList(modelsString: string) {
  if (!modelsString) return [];
  return modelsString.split(',').map(model => model.trim());
}

async function loadPrompt() {
  loading.value = true;
  error.value = '';
  try {
    prompt.value = await promptStore.fetchPromptById(props.promptId);
    if (prompt.value) {
      await loadRelatedPrompts();
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadRelatedPrompts() {
  if (!prompt.value) return;
  
  try {
    // Get all prompts and filter for those with the same name and category
    const allPrompts = promptStore.getPrompts;
    relatedPrompts.value = allPrompts.filter(p => 
      p.name === prompt.value.name && 
      p.category === prompt.value.category &&
      p.id !== prompt.value.id
    );
    
    // Add current prompt to the list for completeness
    relatedPrompts.value.unshift(prompt.value);
  } catch (e: any) {
    console.error('Failed to load related prompts:', e);
  }
}

async function toggleParentPrompt() {
  showParent.value = !showParent.value;
  if (showParent.value && prompt.value?.parentPromptId && !parentPrompt.value) {
    parentLoading.value = true;
    try {
      parentPrompt.value = await promptStore.fetchPromptById(prompt.value.parentPromptId);
    } catch (e: any) {
      parentError.value = e.message;
    } finally {
      parentLoading.value = false;
    }
  }
}

function copyPrompt() {
  if (prompt.value?.promptContent) {
    navigator.clipboard
      .writeText(prompt.value.promptContent)
      .then(() => {
        // Optional: Show a success message
        const element = document.createElement('div');
        element.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
        element.textContent = 'Prompt copied to clipboard!';
        document.body.appendChild(element);
        
        setTimeout(() => {
          element.remove();
        }, 2000);
      })
      .catch((err) => console.error('Failed to copy prompt:', err));
  }
}

function viewRelatedPrompt(promptId: string) {
  emit('select-prompt', promptId);
}

function compareWithPrompt(promptId: string) {
  compareWithPromptId.value = promptId;
  comparisonMode.value = true;
}

function exitComparisonMode() {
  comparisonMode.value = false;
  compareWithPromptId.value = '';
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

watch(
  () => props.promptId,
  () => {
    loadPrompt();
    // Reset comparison mode when prompt changes
    comparisonMode.value = false;
    compareWithPromptId.value = '';
  },
  { immediate: true },
);
</script>
