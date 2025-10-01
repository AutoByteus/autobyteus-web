import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetAgentCustomizationOptions } from '~/graphql/queries/agentCustomizationOptionsQueries';

interface PromptCategory {
  __typename?: 'PromptCategory';
  category: string;
  names: string[];
}

export interface ProcessorOption {
  __typename?: 'ProcessorOption' | 'HookOption';
  name: string;
  isMandatory: boolean;
}

export const useAgentDefinitionOptionsStore = defineStore('agentDefinitionOptions', () => {
  // State
  const toolNames = ref<string[]>([]);
  const inputProcessors = ref<ProcessorOption[]>([]);
  const llmResponseProcessors = ref<ProcessorOption[]>([]);
  const systemPromptProcessors = ref<ProcessorOption[]>([]);
  const toolExecutionResultProcessors = ref<ProcessorOption[]>([]);
  const phaseHooks = ref<ProcessorOption[]>([]);
  const promptCategories = ref<PromptCategory[]>([]);
  
  const loading = ref(false);
  const error = ref<any>(null);

  // Actions
  function fetchAllAvailableOptions() {
    const { onResult, onError, loading: queryLoading } = useQuery(
      GetAgentCustomizationOptions,
      null,
    );

    loading.value = queryLoading.value;

    onResult(result => {
      if (result.data) {
        toolNames.value = result.data.availableToolNames || [];
        inputProcessors.value = result.data.availableInputProcessors || [];
        llmResponseProcessors.value = result.data.availableLlmResponseProcessors || [];
        systemPromptProcessors.value = result.data.availableSystemPromptProcessors || [];
        toolExecutionResultProcessors.value = result.data.availableToolExecutionResultProcessors || [];
        phaseHooks.value = result.data.availablePhaseHooks || [];
        promptCategories.value = result.data.availablePromptCategories || [];
      }
      loading.value = false;
    });

    onError(err => {
      error.value = err;
      loading.value = false;
      console.error("Failed to fetch agent definition options:", err);
    });
  }

  return {
    // State
    toolNames,
    inputProcessors,
    llmResponseProcessors,
    systemPromptProcessors,
    toolExecutionResultProcessors,
    phaseHooks,
    promptCategories,
    loading,
    error,
    // Actions
    fetchAllAvailableOptions,
  };
});
