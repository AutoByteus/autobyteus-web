<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Running Agents</h1>
          <p class="text-gray-500 mt-1">View and manage all active agent instances on the server.</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading running agents...</p>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error loading running agents:</p>
        <p>{{ error.message }}</p>
      </div>
      <div v-else-if="runningAgents.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">No Running Agents Found</h3>
        <p class="mt-1 text-sm text-gray-500">There are no active agent instances on the server.</p>
        <p class="mt-1 text-sm text-gray-500">You can start one from the "Local Agents" page.</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <RunningAgentCard
          v-for="agent in runningAgents"
          :key="agent.id"
          :agent="agent"
          @open-agent="handleOpenAgent"
          @terminate-agent="handleTerminateAgent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useRouter } from 'vue-router';
import { GetAgentInstances } from '~/graphql/queries/agentInstanceQueries';
import { TerminateAgentInstance } from '~/graphql/mutations/agentMutations';
import RunningAgentCard from '~/components/agents/RunningAgentCard.vue';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import type { GetAgentInstancesQuery } from '~/generated/graphql';

const router = useRouter();
const agentLaunchProfileStore = useAgentLaunchProfileStore();
const agentDefinitionStore = useAgentDefinitionStore();

const { result, loading, error, refetch } = useQuery<GetAgentInstancesQuery>(GetAgentInstances, null, {
  fetchPolicy: 'network-only',
});

const runningAgents = computed(() => result.value?.agentInstances || []);

const { mutate: terminateAgent } = useMutation(TerminateAgentInstance);

async function handleOpenAgent(agentInstance: GetAgentInstancesQuery['agentInstances'][0]) {
  if (!agentInstance.agentDefinitionId) {
    alert("Cannot open agent: Agent definition ID is missing.");
    return;
  }
  
  // Ensure agent definitions are loaded
  if (agentDefinitionStore.agentDefinitions.length === 0) {
    await agentDefinitionStore.fetchAllAgentDefinitions();
  }

  const agentDef = agentDefinitionStore.getAgentDefinitionById(agentInstance.agentDefinitionId);
  if (!agentDef) {
    alert(`Cannot open agent: Agent Definition with ID ${agentInstance.agentDefinitionId} not found.`);
    return;
  }
  
  const workspace = agentInstance.workspace;
  
  // Create a new launch profile for this running agent
  const newProfile = agentLaunchProfileStore.createLaunchProfile(
    agentDef,
    workspace?.workspaceId || null,
    workspace?.name || 'No Workspace',
    workspace?.workspaceTypeName || 'No Workspace',
    workspace?.config || {}
  );
  
  // Set it as active and tell the run store to attach to this specific agent ID
  agentLaunchProfileStore.setActiveLaunchProfile(newProfile.id, agentInstance.id);
  
  // Navigate to the workspace
  router.push('/workspace');
}

async function handleTerminateAgent(agentId: string) {
  if (confirm("Are you sure you want to terminate this agent? This action cannot be undone.")) {
    try {
      const result = await terminateAgent({ id: agentId });
      if (result?.data?.terminateAgentInstance?.success) {
        alert("Agent terminated successfully.");
        refetch(); // Refresh the list
      } else {
        throw new Error(result?.data?.terminateAgentInstance?.message || "Termination failed");
      }
    } catch (e: any) {
      alert(`Error terminating agent: ${e.message}`);
      console.error(e);
    }
  }
}
</script>
