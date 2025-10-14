import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import { GetAgentCustomizationOptions } from '~/graphql/queries/agentCustomizationOptionsQueries';
import type { GetAgentCustomizationOptionsQuery } from '~/generated/graphql';

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
  const { client } = useApolloClient();

  // Actions
  async function fetchAllAvailableOptions() {
    loading.value = true;
    error.value = null;
    try {
      const { data, errors } = await client.query<GetAgentCustomizationOptionsQuery>({
        query: GetAgentCustomizationOptions,
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      if (data) {
        toolNames.value = data.availableToolNames || [];
        inputProcessors.value = data.availableInputProcessors || [];
        llmResponseProcessors.value = data.availableLlmResponseProcessors || [];
        systemPromptProcessors.value = data.availableSystemPromptProcessors || [];
        toolExecutionResultProcessors.value = data.availableToolExecutionResultProcessors || [];
        phaseHooks.value = data.availablePhaseHooks || [];
        promptCategories.value = data.availablePromptCategories || [];
      }
    } catch (e) {
      error.value = e;
      console.error("Failed to fetch agent definition options:", e);
    } finally {
      loading.value = false;
    }
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
