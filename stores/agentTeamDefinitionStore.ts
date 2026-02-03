import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getApolloClient } from '~/utils/apolloClient';
import { GetAgentTeamDefinitions } from '~/graphql/queries/agentTeamDefinitionQueries';
import { CreateAgentTeamDefinition, UpdateAgentTeamDefinition, DeleteAgentTeamDefinition } from '~/graphql/mutations/agentTeamDefinitionMutations';
import type { 
  GetAgentTeamDefinitionsQuery,
  CreateAgentTeamDefinitionMutation,
  CreateAgentTeamDefinitionMutationVariables,
  UpdateAgentTeamDefinitionMutation,
  UpdateAgentTeamDefinitionMutationVariables,
  DeleteAgentTeamDefinitionMutation,
  DeleteAgentTeamDefinitionMutationVariables,
  TeamMemberInput,
} from '~/generated/graphql';
import { useServerStore } from '~/stores/serverStore';

// Re-exporting this for use in forms
export type { TeamMemberInput };

export interface AgentTeamDefinition {
  __typename?: 'AgentTeamDefinition';
  id: string;
  name: string;
  description: string;
  role?: string | null;
  coordinatorMemberName: string;
  nodes: {
    __typename?: 'TeamMember';
    memberName: string;
    referenceId: string;
    referenceType: 'AGENT' | 'AGENT_TEAM';
    dependencies: string[];
  }[];
}

export interface CreateAgentTeamDefinitionInput {
  name: string;
  description: string;
  coordinatorMemberName: string;
  role?: string | null;
  nodes: TeamMemberInput[];
}

export interface UpdateAgentTeamDefinitionInput {
  id: string;
  name?: string | null;
  description?: string | null;
  coordinatorMemberName?: string | null;
  role?: string | null;
  nodes?: TeamMemberInput[] | null;
}

export const useAgentTeamDefinitionStore = defineStore('agentTeamDefinition', () => {
  const agentTeamDefinitions = ref<AgentTeamDefinition[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);

  // --- ACTIONS ---

  async function fetchAllAgentTeamDefinitions() {
    if (agentTeamDefinitions.value.length > 0) return;

    const serverStore = useServerStore();
    const isReady = await serverStore.waitForServerReady();
    if (!isReady) {
      error.value = new Error('Server is not ready');
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const client = getApolloClient();
      const { data, errors } = await client.query<GetAgentTeamDefinitionsQuery>({
        query: GetAgentTeamDefinitions,
        // Uses default 'cache-first'
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      agentTeamDefinitions.value = (data.agentTeamDefinitions || []) as AgentTeamDefinition[];
    } catch (e) {
      error.value = e;
      console.error("Failed to fetch agent team definitions:", e);
    } finally {
      loading.value = false;
    }
  }

  async function reloadAllAgentTeamDefinitions() {
    loading.value = true;
    error.value = null;
    try {
      const client = getApolloClient();
      const { data, errors } = await client.query<GetAgentTeamDefinitionsQuery>({
        query: GetAgentTeamDefinitions,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      agentTeamDefinitions.value = (data.agentTeamDefinitions || []) as AgentTeamDefinition[];
    } catch (e) {
      error.value = e;
      console.error("Failed to reload agent team definitions:", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createAgentTeamDefinition(input: CreateAgentTeamDefinitionInput): Promise<AgentTeamDefinition | null> {
    try {
      const client = getApolloClient();
      const cleanedInput = JSON.parse(JSON.stringify(input));
      if (cleanedInput.nodes) {
        cleanedInput.nodes.forEach((node: any) => delete node.__typename);
      }

      const { data, errors } = await client.mutate<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables>({
        mutation: CreateAgentTeamDefinition,
        variables: { input: cleanedInput },
        refetchQueries: [{ query: GetAgentTeamDefinitions }]
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (data?.createAgentTeamDefinition) {
        // The refetch will update the cache and trigger reactivity.
        // We need to wait for the data to be available in the store.
        await client.query({ query: GetAgentTeamDefinitions, fetchPolicy: 'network-only' }).then(({ data }) => {
            agentTeamDefinitions.value = (data.agentTeamDefinitions || []) as AgentTeamDefinition[];
        });
        return getAgentTeamDefinitionById.value(data.createAgentTeamDefinition.id);
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to create agent team definition:", e);
      throw e;
    }
  }

  async function updateAgentTeamDefinition(input: UpdateAgentTeamDefinitionInput): Promise<AgentTeamDefinition | null> {
    try {
      const client = getApolloClient();
      const cleanedInput = JSON.parse(JSON.stringify(input));
      if (cleanedInput.nodes) {
        cleanedInput.nodes.forEach((node: any) => delete node.__typename);
      }

      const { data, errors } = await client.mutate<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables>({
        mutation: UpdateAgentTeamDefinition,
        variables: { input: cleanedInput },
        refetchQueries: [{ query: GetAgentTeamDefinitions }]
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (data?.updateAgentTeamDefinition) {
        await client.query({ query: GetAgentTeamDefinitions, fetchPolicy: 'network-only' }).then(({ data }) => {
            agentTeamDefinitions.value = (data.agentTeamDefinitions || []) as AgentTeamDefinition[];
        });
        return getAgentTeamDefinitionById.value(data.updateAgentTeamDefinition.id);
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to update agent team definition:", e);
      throw e;
    }
  }
  
  async function deleteAgentTeamDefinition(id: string): Promise<boolean> {
    try {
      const client = getApolloClient();
      const { data, errors } = await client.mutate<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables>({
        mutation: DeleteAgentTeamDefinition,
        variables: { id },
        update: (cache) => {
          cache.modify({
            fields: {
              agentTeamDefinitions(existingDefs: any[], { readField }) {
                const newDefs = existingDefs.filter(defRef => readField('id', defRef) !== id);
                agentTeamDefinitions.value = newDefs; // Update local state
                return newDefs;
              }
            }
          });
          cache.evict({ id: cache.identify({ __typename: 'AgentTeamDefinition', id }) });
          cache.gc();
        }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      return !!data?.deleteAgentTeamDefinition?.success;
    } catch (e) {
      error.value = e;
      console.error("Failed to delete agent team definition:", e);
      throw e;
    }
  }

  // --- GETTERS ---
  const getAgentTeamDefinitionById = computed(() => {
    return (id: string) => agentTeamDefinitions.value.find(def => def.id === id) || null;
  });

  const getAgentTeamDefinitionByName = computed(() => {
    return (name: string) => agentTeamDefinitions.value.find(def => def.name === name) || null;
  });

  return {
    agentTeamDefinitions,
    loading,
    error,
    fetchAllAgentTeamDefinitions,
    reloadAllAgentTeamDefinitions,
    createAgentTeamDefinition,
    updateAgentTeamDefinition,
    deleteAgentTeamDefinition,
    getAgentTeamDefinitionById,
    getAgentTeamDefinitionByName,
  };
});
