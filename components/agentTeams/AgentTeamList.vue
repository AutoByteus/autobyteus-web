<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Agent Teams</h1>
          <p class="text-gray-500 mt-1">Manage blueprints for multi-agent teams.</p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="handleReload"
            :disabled="reloading"
            class="flex items-center px-4 py-2 text-sm rounded-lg transition-colors"
            :class="[
              reloading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" :class="{'animate-spin': reloading}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ reloading ? 'Reloading...' : 'Reload' }}
          </button>
          <button @click="$emit('navigate', { view: 'team-create' })" class="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center">
            Create New Team
          </button>
        </div>
      </div>

      <div v-if="loading && !reloading" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading agent team definitions...</p>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error loading agent team definitions:</p>
        <p>{{ error.message }}</p>
      </div>
      <div v-else-if="agentTeamDefinitions.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">No Agent Teams Found</h3>
        <p class="mt-1 text-sm text-gray-500">Create your first agent team to see it here.</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AgentTeamCard
          v-for="teamDef in agentTeamDefinitions"
          :key="teamDef.id"
          :team-def="teamDef"
          @view-details="viewDetails"
          @run-team="handleRunTeam"
        />
      </div>

      <TeamLaunchConfigModal 
        v-if="teamToLaunch"
        :show="isLaunchModalOpen"
        :team-definition="teamToLaunch"
        @close="isLaunchModalOpen = false"
        @success="onLaunchSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAgentTeamDefinitionStore, type AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import AgentTeamCard from '~/components/agentTeams/AgentTeamCard.vue';
import TeamLaunchConfigModal from '~/components/agentTeams/TeamLaunchConfigModal.vue';

const emit = defineEmits(['navigate']);

const store = useAgentTeamDefinitionStore();
const router = useRouter();

const agentTeamDefinitions = computed(() => store.agentTeamDefinitions);
const loading = computed(() => store.loading);
const error = computed(() => store.error);

const isLaunchModalOpen = ref(false);
const teamToLaunch = ref<AgentTeamDefinition | null>(null);
const reloading = ref(false);

onMounted(() => {
  if (agentTeamDefinitions.value.length === 0) {
    store.fetchAllAgentTeamDefinitions();
  }
});

const handleReload = async () => {
  reloading.value = true;
  try {
    await store.reloadAllAgentTeamDefinitions();
  } catch (e) {
    console.error("Failed to reload agent teams:", e);
  } finally {
    reloading.value = false;
  }
};

const viewDetails = (teamId: string) => {
  emit('navigate', { view: 'team-detail', id: teamId });
};

const handleRunTeam = (teamDef: AgentTeamDefinition) => {
  teamToLaunch.value = teamDef;
  isLaunchModalOpen.value = true;
};

const onLaunchSuccess = () => {
  // Do not explicitly close the modal here to avoid a flash of the underlying list
  // before the router navigation completes (which will destroy this component and the modal).
  router.push('/workspace');
};
</script>
