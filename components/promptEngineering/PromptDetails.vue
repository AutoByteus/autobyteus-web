<template>
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- Header with back button and actions -->
      <div class="flex justify-between items-center mb-6">
        <button
          @click="viewStore.closePromptDetails"
          class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </button>
        
        <div class="flex space-x-3">
          <!-- Edit Mode Actions -->
          <template v-if="isEditing">
            <button
              @click="cancelEditing"
              class="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveChanges"
              :disabled="isSaving"
              class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <svg v-if="isSaving" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </template>

          <!-- View Mode Actions -->
          <template v-else>
            <button
              v-if="prompt"
              @click="startEditing"
              class="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              Edit
            </button>
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
          </template>
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
        <!-- Title and metadata (not editable) -->
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

        <!-- Model compatibility -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Compatible Models</h2>
          <div v-if="isEditing">
            <CanonicalModelSelector v-model="formData.suitableForModels" />
          </div>
          <div v-else-if="prompt.suitableForModels" class="flex flex-wrap gap-2">
            <ModelBadge
              v-for="model in modelList"
              :key="model"
              :model="model"
            />
          </div>
           <p v-else class="text-gray-500 text-sm">None specified.</p>
        </div>

        <!-- Description -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <textarea
            v-if="isEditing"
            v-model="formData.description"
            rows="4"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p v-else class="text-gray-700">{{ prompt.description || 'No description provided' }}</p>
        </div>

        <!-- Prompt content -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Prompt Content</h2>
          <textarea
            v-if="isEditing"
            ref="promptContentTextarea"
            v-model="formData.promptContent"
            class="mt-1 block w-full flex-grow p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono resize-none overflow-y-hidden min-h-[200px]"
            @input="adjustTextareaHeight"
          ></textarea>
          <pre
            v-else
            class="whitespace-pre-wrap text-gray-700 font-mono bg-gray-50 p-4 rounded-lg border overflow-auto"
          >{{ prompt.promptContent }}</pre>
        </div>

        <!-- Related prompts section (hidden in edit mode) -->
        <div v-if="relatedPrompts.length > 0 && !isEditing" class="mt-8 pt-6 border-t">
           <!-- ... existing related prompts logic ... -->
        </div>

        <!-- Parent prompt (hidden in edit mode) -->
        <div v-if="prompt.parentPromptId && !isEditing" class="mt-8 pt-6 border-t">
          <!-- ... existing parent prompt logic ... -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive, nextTick } from 'vue';
import { usePromptStore } from '~/stores/promptStore';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';
import ModelBadge from '~/components/promptEngineering/ModelBadge.vue';
import PromptCompare from '~/components/promptEngineering/PromptCompare.vue';
import CanonicalModelSelector from './CanonicalModelSelector.vue';

const props = defineProps<{ promptId: string }>();

const promptStore = usePromptStore();
const viewStore = usePromptEngineeringViewStore();

const prompt = ref<any>(null);
const loading = ref(true);
const error = ref('');
const relatedPrompts = ref<any[]>([]);
const isEditing = ref(false);
const isSaving = ref(false);
const promptContentTextarea = ref<HTMLTextAreaElement | null>(null);

const formData = reactive({
  description: '',
  promptContent: '',
  suitableForModels: [] as string[],
});

function adjustTextareaHeight() {
  const textarea = promptContentTextarea.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}

// Edit mode functions
function startEditing() {
  if (!prompt.value) return;
  formData.description = prompt.value.description || '';
  formData.promptContent = prompt.value.promptContent || '';
  formData.suitableForModels = modelList.value;
  isEditing.value = true;
  nextTick(() => {
    adjustTextareaHeight();
  });
}

function cancelEditing() {
  isEditing.value = false;
  // No need to reset formData, it will be repopulated on next edit
}

async function saveChanges() {
  if (!prompt.value) return;
  isSaving.value = true;
  try {
    const updatedPrompt = await promptStore.updatePrompt(
      prompt.value.id,
      formData.promptContent,
      formData.description,
      formData.suitableForModels.join(', ')
    );
    // Update local prompt data with the response from the store
    prompt.value = { ...prompt.value, ...updatedPrompt };
    isEditing.value = false;
  } catch (err) {
    console.error("Failed to update prompt:", err);
    // Optionally show an error toast to the user
  } finally {
    isSaving.value = false;
  }
}

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
  return prompt.value.suitableForModels.split(',').map((model: string) => model.trim()).filter(Boolean);
});

function parseModelList(modelsString: string) {
  if (!modelsString) return [];
  return modelsString.split(',').map(model => model.trim()).filter(Boolean);
}

async function loadPrompt() {
  loading.value = true;
  isEditing.value = false; // Ensure we are not in edit mode when a new prompt loads
  error.value = '';
  try {
    const fetchedPrompt = await promptStore.fetchPromptById(props.promptId);
    prompt.value = fetchedPrompt; // Use a different variable name here
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
    const allPrompts = promptStore.getPrompts;
    relatedPrompts.value = allPrompts.filter(p => 
      p.name === prompt.value.name && 
      p.category === prompt.value.category
    );
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
  viewStore.showPromptDetails(promptId);
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
    comparisonMode.value = false;
    compareWithPromptId.value = '';
  },
  { immediate: true },
);
</script>
