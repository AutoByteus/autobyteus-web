import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetAgentCustomizationOptions } from '~/graphql/queries/agentCustomizationOptionsQueries';

interface PromptCategory {
  category: string;
  names: string[];
}

interface AgentDefinitionOptionsState {
  toolNames: string[];
  inputProcessorNames: string[];
  llmResponseProcessorNames: string[];
  systemPromptProcessorNames: string[];
  toolExecutionResultProcessorNames: string[];
  phaseHookNames: string[];
  promptCategories: PromptCategory[];
  loading: boolean;
  error: any;
  fetched: boolean;
}

export const useAgentDefinitionOptionsStore = defineStore('agentDefinitionOptions', () => {
  // State
  const toolNames = ref<string[]>([]);
  const inputProcessorNames = ref<string[]>([]);
  const llmResponseProcessorNames = ref<string[]>([]);
  const systemPromptProcessorNames = ref<string[]>([]);
  const toolExecutionResultProcessorNames = ref<string[]>([]);
  const phaseHookNames = ref<string[]>([]);
  const promptCategories = ref<PromptCategory[]>([]);
  
  const loading = ref(false);
  const error = ref<any>(null);
  const fetched = ref(false); // To prevent multiple fetches

  // Actions
  function fetchAllAvailableOptions() {
    if (fetched.value) return;

    const { onResult, onError, loading: queryLoading } = useQuery(
      GetAgentCustomizationOptions,
      null,
      { fetchPolicy: 'network-only' }
    );

    loading.value = queryLoading.value;

    onResult(result => {
      if (result.data) {
        toolNames.value = result.data.availableToolNames || [];
        inputProcessorNames.value = result.data.availableInputProcessorNames || [];
        llmResponseProcessorNames.value = result.data.availableLlmResponseProcessorNames || [];
        systemPromptProcessorNames.value = result.data.availableSystemPromptProcessorNames || [];
        toolExecutionResultProcessorNames.value = result.data.availableToolExecutionResultProcessorNames || [];
        phaseHookNames.value = result.data.availablePhaseHookNames || [];
        promptCategories.value = result.data.availablePromptCategories || [];
        fetched.value = true;
      }
      loading.value = false;
    });

    onError(err => {
      error.value = err;
      loading.value = false;
      console.error("Failed to fetch agent definition options:", err);
    });
  }

  function invalidateCache() {
    fetched.value = false;
  }

  return {
    // State
    toolNames,
    inputProcessorNames,
    llmResponseProcessorNames,
    systemPromptProcessorNames,
    toolExecutionResultProcessorNames,
    phaseHookNames,
    promptCategories,
    loading,
    error,
    fetched,
    // Actions
    fetchAllAvailableOptions,
    invalidateCache,
  };
});
