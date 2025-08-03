import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useMutation, useApolloClient } from '@vue/apollo-composable';
import { GetAgentDefinitions } from '~/graphql/queries/agentDefinitionQueries';
import { CreateAgentDefinition, UpdateAgentDefinition, DeleteAgentDefinition } from '~/graphql/mutations/agentDefinitionMutations';

// This interface should match the GraphQL AgentDefinition type
export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  toolNames: string[];
  inputProcessorNames: string[];
  llmResponseProcessorNames: string[];
  systemPromptProcessorNames: string[];
  phaseHookNames: string[];
  prompts: {
    id: string;
    name: string;
    category: string;
    isForAgentTeam: boolean;
  }[];
  systemPromptCategory?: string;
  systemPromptName?: string;
}

// Interfaces for mutation inputs
export interface CreateAgentDefinitionInput {
  name: string;
  role: string;
  description: string;
  systemPromptCategory: string;
  systemPromptName: string;
  toolNames?: string[];
  inputProcessorNames?: string[];
  llmResponseProcessorNames?: string[];
  systemPromptProcessorNames?: string[];
  phaseHookNames?: string[];
}

export interface UpdateAgentDefinitionInput {
  id: string;
  name?: string;
  role?: string;
  description?: string;
  systemPromptCategory?: string;
  systemPromptName?: string;
  toolNames?: string[];
  inputProcessorNames?: string[];
  llmResponseProcessorNames?: string[];
  systemPromptProcessorNames?: string[];
  phaseHookNames?: string[];
}

interface AgentDefinitionState {
  agentDefinitions: AgentDefinition[];
  loading: boolean;
  error: any;
}

export const useAgentDefinitionStore = defineStore('agentDefinition', () => {
  const agentDefinitions = ref<AgentDefinition[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);
  const { client } = useApolloClient();

  // --- ACTIONS ---

  // Fetch all agent definitions
  async function fetchAllAgentDefinitions() {
    loading.value = true;
    error.value = null;
    try {
      const { data, errors } = await client.query({
        query: GetAgentDefinitions,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      agentDefinitions.value = data.agentDefinitions || [];
    } catch (e) {
      error.value = e;
      console.error("Failed to fetch agent definitions:", e);
    } finally {
      loading.value = false;
    }
  }

  // Create a new agent definition
  async function createAgentDefinition(input: CreateAgentDefinitionInput): Promise<AgentDefinition | null> {
    const { mutate, loading: mutationLoading, error: mutationError } = useMutation(CreateAgentDefinition);
    loading.value = true;
    
    try {
      const result = await mutate({ input });
      if (mutationError.value) {
        throw mutationError.value;
      }
      if (result?.data?.createAgentDefinition) {
        // Refresh the list after creation
        await fetchAllAgentDefinitions();
        return result.data.createAgentDefinition;
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to create agent definition:", e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Update an agent definition
  async function updateAgentDefinition(input: UpdateAgentDefinitionInput): Promise<AgentDefinition | null> {
    const { mutate, loading: mutationLoading, error: mutationError } = useMutation(UpdateAgentDefinition);
    loading.value = true;

    try {
      const result = await mutate({ input });
      if (mutationError.value) {
        throw mutationError.value;
      }
      if (result?.data?.updateAgentDefinition) {
        // Refresh the list after update
        await fetchAllAgentDefinitions();
        return result.data.updateAgentDefinition;
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to update agent definition:", e);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  // Delete an agent definition
  async function deleteAgentDefinition(id: string): Promise<boolean> {
    const { mutate, loading: mutationLoading, error: mutationError } = useMutation(DeleteAgentDefinition);
    loading.value = true;

    try {
      const result = await mutate({ id });
      if (mutationError.value) {
        throw mutationError.value;
      }
      if (result?.data?.deleteAgentDefinition?.success) {
        // Refresh the list after deletion
        await fetchAllAgentDefinitions();
        return true;
      }
      return false;
    } catch (e) {
      error.value = e;
      console.error("Failed to delete agent definition:", e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // --- GETTERS ---
  const getAgentDefinitionById = computed(() => {
    return (id: string) => agentDefinitions.value.find(def => def.id === id);
  });

  return {
    // State
    agentDefinitions,
    loading,
    error,
    // Actions
    fetchAllAgentDefinitions,
    createAgentDefinition,
    updateAgentDefinition,
    deleteAgentDefinition,
    // Getters
    getAgentDefinitionById,
  };
});
