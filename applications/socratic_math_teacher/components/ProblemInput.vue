<template>
  <div class="p-6 h-full flex flex-col space-y-4">
    <div>
      <h2 class="text-xl font-semibold text-gray-800 mb-2">Math Problem</h2>
      <p class="text-sm text-gray-500">Describe the problem and provide any relevant files as context.</p>
    </div>

    <AppInputForm
      v-model:problemText="problemText"
      v-model:contextFiles="contextFiles"
      @open-file="handleOpenFile"
    />

    <!-- Agent LLM Configuration Section - Inline -->
    <div class="pt-2">
      <h3 class="text-lg font-semibold text-gray-700">Agent Configuration</h3>
      <div v-if="isLoadingConfig" class="mt-2 text-sm text-gray-500">Loading configurations...</div>
      <div v-else-if="loadingError" class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">{{ loadingError }}</div>
      <div v-else class="mt-2 space-y-3 bg-white p-3 rounded-md border">
        <div v-for="agentName in requiredAgents" :key="agentName">
          <label :for="`llm-select-${agentName}`" class="block text-sm font-medium text-gray-700 mb-1">
            {{ agentName }}
          </label>
          <select
            :id="`llm-select-${agentName}`"
            v-model="localAgentConfig[agentName]"
            class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="mt-auto pt-4">
      <button
        @click="handleSubmit"
        :disabled="isSubmitDisabled"
        class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isLoading ? 'Processing...' : 'Solve & Animate' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useSocraticMathTeacherStore } from '../store';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import type { ContextFilePath } from '~/types/conversation';
import AppInputForm from './AppInputForm.vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { useQuery } from '@vue/apollo-composable';
import { GetApplicationDetail } from '~/graphql/queries/applicationQueries';

// --- PROPS & EMITS ---
const props = defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: {
    problemText: string;
    contextFiles: ContextFilePath[];
  }): void;
}>();

// --- STORES ---
const store = useSocraticMathTeacherStore();
const fileExplorerStore = useFileExplorerStore();
const llmProviderConfigStore = useLLMProviderConfigStore();

// --- LOCAL STATE ---
const problemText = ref('');
const contextFiles = ref<ContextFilePath[]>([]);
const localAgentConfig = reactive<Record<string, string>>({});

// --- DATA FETCHING ---
const availableModels = computed(() => llmProviderConfigStore.models);
const { result: appDetailResult, loading: isLoadingAppDetail, error: appDetailError, refetch: refetchAppDetail } = useQuery(GetApplicationDetail, { appId: "socratic_math_teacher" }, { enabled: false });
const requiredAgents = computed(() => {
  const agentsFromApi = appDetailResult.value?.getApplicationDetail?.requiredAgents;
  if (agentsFromApi && agentsFromApi.length > 0) {
    return agentsFromApi;
  }
  // Fallback to keys from the store's configuration
  return Object.keys(store.agentLlmConfig);
});
const isLoadingConfig = computed(() => store.isConfigLoading || isLoadingAppDetail.value || llmProviderConfigStore.isLoadingModels);
const loadingError = computed(() => appDetailError.value ? "Failed to load application details." : null);

onMounted(() => {
  if (llmProviderConfigStore.models.length === 0) {
    llmProviderConfigStore.fetchProvidersWithModels();
  }
  refetchAppDetail();
});

// --- STATE SYNC ---
// Sync local config from the store's master config
watch(() => store.agentLlmConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(localAgentConfig, newConfig);
  }
}, { immediate: true, deep: true });

// Ensure local config has a valid selection for every required agent once data is loaded
watch([requiredAgents, availableModels], ([agents, models]) => {
  if (agents.length > 0 && models.length > 0) {
    for (const agentName of agents) {
      const currentSelection = localAgentConfig[agentName];
      const preferredSelection = store.agentLlmConfig[agentName];

      // If the current selection is invalid (not set or not in available models)
      if (!currentSelection || !models.includes(currentSelection)) {
        // Check if the preferred default from the store is available
        if (preferredSelection && models.includes(preferredSelection)) {
          // If yes, use it
          localAgentConfig[agentName] = preferredSelection;
        } else {
          // Otherwise, fall back to the first available model
          localAgentConfig[agentName] = models[0] || '';
        }
      }
    }
  }
}, { immediate: true, deep: true });


// --- COMPUTED ---
const isSubmitDisabled = computed(() => {
  return props.isLoading || !problemText.value.trim();
});

// --- METHODS ---
function handleOpenFile(file: ContextFilePath) {
  fileExplorerStore.openFile(file.path);
}

function handleSubmit() {
  if (problemText.value.trim()) {
    // First, save the configuration if it has changed.
    store.saveConfiguration(JSON.parse(JSON.stringify(localAgentConfig)));

    // Then, emit the submit event.
    emit('submit', {
      problemText: problemText.value.trim(),
      contextFiles: contextFiles.value,
    });
  }
}
</script>
