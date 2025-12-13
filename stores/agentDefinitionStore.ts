import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import { GetAgentDefinitions } from '~/graphql/queries/agentDefinitionQueries';
import { CreateAgentDefinition, UpdateAgentDefinition, DeleteAgentDefinition } from '~/graphql/mutations/agentDefinitionMutations';
import type { GetAgentDefinitionsQuery } from '~/generated/graphql';

// This interface should match the GraphQL AgentDefinition type
export interface AgentDefinition {
  __typename?: 'AgentDefinition';
  id: string;
  name: string;
  role: string;
  description: string;
  toolNames: string[];
  inputProcessorNames: string[];
  llmResponseProcessorNames: string[];
  systemPromptProcessorNames: string[];
  toolExecutionResultProcessorNames: string[];
  toolInvocationPreprocessorNames: string[];
  phaseHookNames: string[];
  prompts: {
    __typename?: 'Prompt';
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
  toolExecutionResultProcessorNames?: string[];
  toolInvocationPreprocessorNames?: string[];
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
  toolExecutionResultProcessorNames?: string[];
  toolInvocationPreprocessorNames?: string[];
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

  // Fetch all agent definitions (cache-first)
  async function fetchAllAgentDefinitions() {
    if (agentDefinitions.value.length > 0) return; // Already fetched, rely on cache for updates.
    loading.value = true;
    error.value = null;
    try {
      const { data, errors } = await client.query<GetAgentDefinitionsQuery>({
        query: GetAgentDefinitions,
        // The default fetchPolicy is now 'cache-first'
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

  // Force a reload from the network
  async function reloadAllAgentDefinitions() {
    loading.value = true;
    error.value = null;
    try {
      const { data, errors } = await client.query<GetAgentDefinitionsQuery>({
        query: GetAgentDefinitions,
        fetchPolicy: 'network-only', // Bypass the cache
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      agentDefinitions.value = data.agentDefinitions || [];
    } catch (e) {
      error.value = e;
      console.error("Failed to reload agent definitions:", e);
      throw e; // Re-throw so the component can handle it
    } finally {
      loading.value = false;
    }
  }

  // Create a new agent definition
  async function createAgentDefinition(input: CreateAgentDefinitionInput): Promise<AgentDefinition | null> {
    try {
      const { data, errors } = await client.mutate({
        mutation: CreateAgentDefinition,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.createAgentDefinition) return;

          // Read the existing agent definitions from the cache
          const existingData = cache.readQuery<GetAgentDefinitionsQuery>({ query: GetAgentDefinitions });
          if (!existingData) return;

          // Add the new agent to the beginning of the list
          const newAgentDefinitions = [data.createAgentDefinition, ...existingData.agentDefinitions];
          
          // Write the updated list back to the cache
          cache.writeQuery({
            query: GetAgentDefinitions,
            data: {
              agentDefinitions: newAgentDefinitions,
            },
          });

          // Also update our local pinia state for immediate reactivity
          agentDefinitions.value = newAgentDefinitions as AgentDefinition[];
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      return data?.createAgentDefinition || null;
    } catch (e) {
      error.value = e;
      console.error("Failed to create agent definition:", e);
      throw e; // Rethrow to be handled by the component
    }
  }

  // Update an agent definition
  async function updateAgentDefinition(input: UpdateAgentDefinitionInput): Promise<AgentDefinition | null> {
    try {
      const { data, errors } = await client.mutate({
        mutation: UpdateAgentDefinition,
        variables: { input },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (data?.updateAgentDefinition) {
        // Update the item in our local pinia state
        const index = agentDefinitions.value.findIndex(d => d.id === input.id);
        if (index !== -1) {
            // FIX: Create a new array to avoid mutating a read-only one from the cache.
            const newAgentDefinitions = [...agentDefinitions.value];
            newAgentDefinitions[index] = { ...newAgentDefinitions[index], ...data.updateAgentDefinition };
            agentDefinitions.value = newAgentDefinitions;
        }
        return data.updateAgentDefinition;
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to update agent definition:", e);
      throw e;
    }
  }
  
  // Delete an agent definition
  async function deleteAgentDefinition(id: string): Promise<boolean> {
    try {
      const { data, errors } = await client.mutate({
        mutation: DeleteAgentDefinition,
        variables: { id },
        update: (cache) => {
          // This function handles the optimistic update of the Apollo cache.
          const normalizedId = cache.identify({ __typename: 'AgentDefinition', id });
          cache.evict({ id: normalizedId });
          cache.gc();

          cache.modify({
            fields: {
              agentDefinitions(existingDefsRefs = [], { readField }) {
                return existingDefsRefs.filter(defRef => readField('id', defRef) !== id);
              },
            },
          });
        }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (data?.deleteAgentDefinition?.success) {
        // Update local Pinia state now that the operation is confirmed by the server.
        agentDefinitions.value = agentDefinitions.value.filter(def => def.id !== id);
        return true;
      }
      return false;
    } catch (e) {
      error.value = e;
      console.error("Failed to delete agent definition:", e);
      throw e;
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
    reloadAllAgentDefinitions,
    createAgentDefinition,
    updateAgentDefinition,
    deleteAgentDefinition,
    // Getters
    getAgentDefinitionById,
  };
});
