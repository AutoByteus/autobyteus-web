<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Local Agents</h1>
          <p class="text-gray-500 mt-1">Access your installed local AI agents</p>
        </div>
        <button @click="$emit('navigate', { view: 'create' })" class="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center">
          Create New Agent
        </button>
      </div>

      <!-- Single Box Search Filter -->
      <div class="mb-6">
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span class="i-heroicons-magnifying-glass-20-solid text-gray-400 w-5 h-5" aria-hidden="true" />
          </div>
          <input
            type="text"
            v-model="searchQuery"
            name="agent-search"
            id="agent-search"
            class="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2.5"
            placeholder="Search agents by name or description..."
          />
        </div>
      </div>

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading agent definitions...</p>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error loading agent definitions:</p>
        <p>{{ error.message }}</p>
      </div>

      <!-- Agent Grid -->
      <div v-else-if="filteredAgentDefinitions.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AgentCard
          v-for="agentDef in filteredAgentDefinitions"
          :key="agentDef.id"
          :agent-def="agentDef"
          @view-details="viewDetails"
          @run-agent="runAgent"
        />
      </div>

      <!-- Empty State for Search -->
      <div v-else class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
         <h3 class="text-lg font-medium text-gray-900">No Agents Found</h3>
         <p class="mt-1 text-sm text-gray-500">
            No agents matched your search query "{{ searchQuery }}".
         </p>
      </div>
    </div>

    <!-- Workspace Configuration Modal -->
    <WorkspaceConfigModal
      v-if="selectedAgent"
      :agent-definition-id="selectedAgent.id"
      :agent-name="selectedAgent.name"
      @close="selectedAgent = null"
      @success="onWorkspaceCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAgentDefinitionStore, type AgentDefinition } from '~/stores/agentDefinitionStore';
import { useAgentDefinitionOptionsStore } from '~/stores/agentDefinitionOptionsStore';
import AgentCard from '~/components/agents/AgentCard.vue';
import WorkspaceConfigModal from '~/components/workspace/WorkspaceConfigModal.vue';

const emit = defineEmits(['navigate']);

const agentDefinitionStore = useAgentDefinitionStore();
const agentDefinitionOptionsStore = useAgentDefinitionOptionsStore();

const agentDefinitions = computed(() => agentDefinitionStore.agentDefinitions);
const loading = computed(() => agentDefinitionStore.loading);
const error = computed(() => agentDefinitionStore.error);

const selectedAgent = ref<AgentDefinition | null>(null);
const searchQuery = ref('');

const filteredAgentDefinitions = computed(() => {
  if (!searchQuery.value) {
    return agentDefinitions.value;
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return agentDefinitions.value.filter(agent =>
    agent.name.toLowerCase().includes(lowerCaseQuery) ||
    agent.description.toLowerCase().includes(lowerCaseQuery)
  );
});

onMounted(() => {
  // Fetch main agent definitions
  if (agentDefinitions.value.length === 0) {
    agentDefinitionStore.fetchAllAgentDefinitions();
  }
  // Fetch options for the create/edit form
  agentDefinitionOptionsStore.fetchAllAvailableOptions();
});

const viewDetails = (agentId: string) => {
  emit('navigate', { view: 'detail', id: agentId });
};

const runAgent = (agentDef: AgentDefinition) => {
  selectedAgent.value = agentDef;
};

const onWorkspaceCreated = () => {
  selectedAgent.value = null; // Close the modal
  navigateTo('/workspace'); // Navigate to the workspace view
};
</script>
