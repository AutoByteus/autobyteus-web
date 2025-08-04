<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Agent Teams</h1>
          <p class="text-gray-500 mt-1">Manage blueprints for multi-agent teams.</p>
        </div>
        <button @click="$emit('navigate', { view: 'team-create' })" class="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center">
          Create New Team
        </button>
      </div>

      <div v-if="loading" class="text-center py-20">
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
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import AgentTeamCard from '~/components/agentTeams/AgentTeamCard.vue';

const emit = defineEmits(['navigate']);

const store = useAgentTeamDefinitionStore();

const agentTeamDefinitions = computed(() => store.agentTeamDefinitions);
const loading = computed(() => store.loading);
const error = computed(() => store.error);

onMounted(() => {
  if (agentTeamDefinitions.value.length === 0) {
    store.fetchAllAgentTeamDefinitions();
  }
});

const viewDetails = (teamId: string) => {
  emit('navigate', { view: 'team-detail', id: teamId });
};
</script>
