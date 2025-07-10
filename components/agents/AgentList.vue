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

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading agent definitions...</p>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error loading agent definitions:</p>
        <p>{{ error.message }}</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AgentCard
          v-for="agentDef in agentDefinitions"
          :key="agentDef.id"
          :agent-def="agentDef"
          @view-details="viewDetails"
          @run-agent="runAgent"
        />
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
