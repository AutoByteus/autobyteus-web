import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useMutation, useApolloClient } from '@vue/apollo-composable';
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

// Re-exporting this for use in forms
export type { TeamMemberInput };

export interface AgentTeamDefinition {
  id: string;
  name: string;
  description: string;
  role?: string | null;
  coordinatorMemberName: string;
  nodes: {
    __typename?: 'TeamMember'; // Acknowledge that __typename can exist from queries
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
  const { client } = useApolloClient();

  // --- ACTIONS ---

  async function fetchAllAgentTeamDefinitions() {
    loading.value = true;
    error.value = null;
    try {
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
      console.error("Failed to fetch agent team definitions:", e);
    } finally {
      loading.value = false;
    }
  }

  async function createAgentTeamDefinition(input: CreateAgentTeamDefinitionInput): Promise<AgentTeamDefinition | null> {
    const { mutate } = useMutation<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables>(CreateAgentTeamDefinition);
    
    try {
      // Create a clean copy of the input, removing __typename from nodes.
      // This is necessary because Apollo Client adds __typename to cached objects.
      const cleanedInput = JSON.parse(JSON.stringify(input));
      if (cleanedInput.nodes) {
        cleanedInput.nodes.forEach((node: any) => delete node.__typename);
      }

      const result = await mutate({ input: cleanedInput });
      if (result?.data?.createAgentTeamDefinition) {
        await fetchAllAgentTeamDefinitions();
        // The result from create might be minimal, so we find the full object from our updated list.
        return getAgentTeamDefinitionById.value(result.data.createAgentTeamDefinition.id);
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to create agent team definition:", e);
      throw e;
    }
  }

  async function updateAgentTeamDefinition(input: UpdateAgentTeamDefinitionInput): Promise<AgentTeamDefinition | null> {
    const { mutate } = useMutation<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables>(UpdateAgentTeamDefinition);

    try {
      // Create a clean copy of the input, removing __typename from nodes.
      // This is necessary because Apollo Client adds __typename to cached objects.
      const cleanedInput = JSON.parse(JSON.stringify(input));
      if (cleanedInput.nodes) {
        cleanedInput.nodes.forEach((node: any) => delete node.__typename);
      }

      const result = await mutate({ input: cleanedInput });
      if (result?.data?.updateAgentTeamDefinition) {
        await fetchAllAgentTeamDefinitions();
         // The result from update might be minimal, so we find the full object from our updated list.
        return getAgentTeamDefinitionById.value(result.data.updateAgentTeamDefinition.id);
      }
      return null;
    } catch (e) {
      error.value = e;
      console.error("Failed to update agent team definition:", e);
      throw e;
    }
  }
  
  async function deleteAgentTeamDefinition(id: string): Promise<boolean> {
    const { mutate } = useMutation<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables>(DeleteAgentTeamDefinition);
    
    try {
      const result = await mutate({ id });
      if (result?.data?.deleteAgentTeamDefinition?.success) {
        await fetchAllAgentTeamDefinitions();
        return true;
      }
      return false;
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

  return {
    agentTeamDefinitions,
    loading,
    error,
    fetchAllAgentTeamDefinitions,
    createAgentTeamDefinition,
    updateAgentTeamDefinition,
    deleteAgentTeamDefinition,
    getAgentTeamDefinitionById,
  };
});
