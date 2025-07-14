import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
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

  // --- ACTIONS ---

  // Fetch all agent definitions
  function fetchAllAgentDefinitions() {
    const { onResult, onError, loading: queryLoading } = useQuery(GetAgentDefinitions, null, {
      fetchPolicy: 'network-only', // Always fetch from the network
    });

    loading.value = queryLoading.value;

    onResult(result => {
      if (result.data) {
        agentDefinitions.value = result.data.agentDefinitions;
      }
      loading.value = false;
    });

    onError(err => {
      error.value = err;
      loading.value = false;
      console.error("Failed to fetch agent definitions:", err);
    });
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
        fetchAllAgentDefinitions();
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
        fetchAllAgentDefinitions();
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
        fetchAllAgentDefinitions();
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
