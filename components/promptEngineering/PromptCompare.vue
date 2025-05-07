<template>
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="h-full flex flex-col">
      <!-- Header with controls -->
      <div class="bg-white border-b p-4 flex justify-between items-center">
        <div class="flex items-center">
          <button
            @click="$emit('close')"
            class="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Marketplace
          </button>
          <h2 class="text-xl font-semibold text-gray-800">Comparing Prompts</h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-2">Display:</span>
            <div class="flex border border-gray-300 rounded-md overflow-hidden">
              <button 
                @click="viewMode = 'side-by-side'"
                class="px-3 py-1 text-sm flex items-center"
                :class="viewMode === 'side-by-side' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'"
              >
                Side-by-side
              </button>
              <button 
                @click="viewMode = 'line-by-line'"
                class="px-3 py-1 text-sm flex items-center"
                :class="viewMode === 'line-by-line' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'"
              >
                Line-by-line
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div>
              <select
                v-model="leftPromptId"
                class="block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                @change="updateDiffView()"
              >
                <option v-for="prompt in prompts" :key="`left-${prompt.id}`" :value="prompt.id">
                  {{ prompt.name }} ({{ getModelsSummary(prompt) }})
                </option>
              </select>
            </div>
            <div>
              <select
                v-model="rightPromptId"
                class="block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                @change="updateDiffView()"
              >
                <option v-for="prompt in prompts" :key="`right-${prompt.id}`" :value="prompt.id">
                  {{ prompt.name }} ({{ getModelsSummary(prompt) }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Model badges and info -->
      <div class="bg-gray-50 p-4 border-b grid grid-cols-2 gap-4">
        <div v-if="leftPrompt" class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900">{{ leftPrompt.name }}</h3>
            <span class="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1">
              v{{ leftPrompt.version }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <ModelBadge
              v-for="model in getModelList(leftPrompt)"
              :key="`left-${model}`"
              :model="model"
              size="small"
            />
          </div>
        </div>
        <div v-if="rightPrompt" class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900">{{ rightPrompt.name }}</h3>
            <span class="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1">
              v{{ rightPrompt.version }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <ModelBadge
              v-for="model in getModelList(rightPrompt)"
              :key="`right-${model}`"
              :model="model"
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Diff Viewer -->
      <div class="flex-grow relative p-4 overflow-auto">
        <div 
          v-if="leftPrompt && rightPrompt"
          ref="diffContainer" 
          class="diff-container"
        ></div>
        <div v-else class="grid place-items-center h-full bg-gray-50">
          <p class="text-gray-500">Select two prompts to compare</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import * as Diff from 'diff';
import * as Diff2Html from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import { usePromptStore } from '~/stores/promptStore';
import ModelBadge from '~/components/promptEngineering/ModelBadge.vue';

const props = defineProps<{  promptIds: string[];
  promptCategory: string;
  promptName: string;
}>();

const emit = defineEmits<{  (e: 'close'): void;
}>();

const promptStore = usePromptStore();

// Local state
const leftPromptId = ref('');
const rightPromptId = ref('');
const leftPrompt = ref<any>(null);
const rightPrompt = ref<any>(null);
const diffContainer = ref<HTMLElement | null>(null);
const viewMode = ref<'side-by-side' | 'line-by-line'>('side-by-side');

// Get all prompts with the same name and category
const prompts = computed(() => {
  return promptStore.getPrompts.filter(
    p => p.name === props.promptName && p.category === props.promptCategory
  );
});

// Helper functions
function getModelList(prompt: any) {
  if (!prompt?.suitableForModels) return [];
  return prompt.suitableForModels.split(',').map((model: string) => model.trim());
}

function getModelsSummary(prompt: any) {
  const models = getModelList(prompt);
  if (models.length === 0) return 'No models specified';
  if (models.length === 1) return models[0];
  return `${models[0]} + ${models.length - 1} more`;
}

// Generate and render the diff
function renderDiff() {
  if (!diffContainer.value || !leftPrompt.value || !rightPrompt.value) return;
  
  const left = leftPrompt.value.promptContent || '';
  const right = rightPrompt.value.promptContent || '';
  
  // Calculate the diff
  const diffText = Diff.createPatch(
    'comparison', 
    left, 
    right, 
    'Left Version', 
    'Right Version'
  );
  
  // Render with diff2html
  const diffHtml = Diff2Html.html(diffText, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: viewMode.value,
    renderNothingWhenEmpty: false,
    colorScheme: 'light'
  });
  
  diffContainer.value.innerHTML = diffHtml;
  
  // Customize the diff appearance
  if (diffContainer.value) {
    // Make file header more compact
    const headers = diffContainer.value.querySelectorAll('.d2h-file-header');
    headers.forEach(header => {
      header.classList.add('hidden');
    });
  }
}

// Update the diff view when prompts change
async function updateDiffView() {
  if (leftPromptId.value) {
    try {
      leftPrompt.value = await promptStore.fetchPromptById(leftPromptId.value);
    } catch (e) {
      console.error('Failed to load left prompt:', e);
    }
  }

  if (rightPromptId.value) {
    try {
      rightPrompt.value = await promptStore.fetchPromptById(rightPromptId.value);
    } catch (e) {
      console.error('Failed to load right prompt:', e);
    }
  }
  
  nextTick(() => {
    renderDiff();
  });
}

// Initialize with first two prompts if available
onMounted(() => {
  if (props.promptIds.length >= 2) {
    leftPromptId.value = props.promptIds[0];
    rightPromptId.value = props.promptIds[1];
  } else if (props.promptIds.length === 1 && prompts.value.length >= 2) {
    leftPromptId.value = props.promptIds[0];
    // Find another prompt that's not the first one
    const otherPrompts = prompts.value.filter(p => p.id !== props.promptIds[0]);
    if (otherPrompts.length > 0) {
      rightPromptId.value = otherPrompts[0].id;
    }
  } else if (prompts.value.length >= 2) {
    leftPromptId.value = prompts.value[0].id;
    rightPromptId.value = prompts.value[1].id;
  }

  if (leftPromptId.value || rightPromptId.value) {
    updateDiffView();
  }
});

// Watch for changes to selected prompts or view mode
watch([leftPromptId, rightPromptId, viewMode], () => {
  updateDiffView();
});
</script>

<style>
/* Custom styles for diff2html */
.d2h-wrapper {
  margin-bottom: 0;
}

.d2h-file-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0;
}

.d2h-file-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
}

.d2h-diff-tbody {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
}

.d2h-code-line-ctn {
  padding: 0 8px;
}

.d2h-code-linenumber {
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  color: #94a3b8;
}

.d2h-ins {
  background-color: #dcfce7;
}

.d2h-ins .d2h-code-linenumber {
  background-color: #dcfce7;
  border-color: #bbf7d0;
}

.d2h-del {
  background-color: #fee2e2;
}

.d2h-del .d2h-code-linenumber {
  background-color: #fee2e2;
  border-color: #fecaca;
}

.d2h-code-line ins, .d2h-code-line del {
  display: inline-block;
  border-radius: 2px;
  padding: 0 2px;
}

.d2h-code-line ins {
  background-color: #86efac;
  text-decoration: none;
}

.d2h-code-line del {
  background-color: #fca5a5;
  text-decoration: none;
}

/* Utility class for hiding elements */
.hidden {
  display: none !important;
}
</style>
