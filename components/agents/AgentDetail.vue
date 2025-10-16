<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading Agent Details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="!agentDef" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <h3 class="font-bold">Agent Not Found</h3>
        <p>The agent definition with the specified ID could not be found.</p>
        <button @click="$emit('navigate', { view: 'list' })" class="text-indigo-600 hover:underline mt-2 inline-block">&larr; Back to all agents</button>
      </div>

      <!-- Content -->
      <div v-else>
        <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <!-- Header -->
          <div class="flex justify-between items-start mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ agentDef.name }}</h1>
              <p class="text-md text-gray-500 mt-1">{{ agentDef.role }}</p>
            </div>
            <div class="flex space-x-2">
              <button @click="selectAgentToRun(agentDef)" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                <span class="block i-heroicons-play-20-solid w-5 h-5 mr-2"></span>
                Run Agent
              </button>
              <button @click="$emit('navigate', { view: 'edit', id: agentDef.id })" class="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors flex items-center">
                <span class="block i-heroicons-pencil-square-20-solid w-5 h-5 mr-2"></span>
                Edit
              </button>
              <button @click="handleDelete(agentDef.id)" class="px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-md hover:bg-red-100 transition-colors flex items-center">
                <span class="block i-heroicons-trash-20-solid w-5 h-5 mr-2"></span>
                Delete
              </button>
            </div>
          </div>
          
          <!-- Description -->
          <div class="border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Description</h2>
            <p class="text-gray-600 whitespace-pre-wrap">{{ agentDef.description }}</p>
          </div>

          <!-- System Prompt -->
          <div class="border-t border-gray-200 pt-6 mt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">System Prompt</h2>
            <div v-if="agentDef.systemPromptCategory && agentDef.systemPromptName" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-500">Category</h3>
                <p class="text-base text-gray-800 font-mono bg-gray-50 px-3 py-1.5 rounded-md mt-1">{{ agentDef.systemPromptCategory }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Name</h3>
                <p class="text-base text-gray-800 font-mono bg-gray-50 px-3 py-1.5 rounded-md mt-1">{{ agentDef.systemPromptName }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">No system prompt configured.</p>
          </div>
          
          <!-- Tools -->
          <div class="border-t border-gray-200 pt-6 mt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Tools</h2>
            <ul v-if="agentDef.toolNames && agentDef.toolNames.length" class="space-y-2">
              <li v-for="item in agentDef.toolNames" :key="item" class="text-sm font-mono bg-gray-50 text-gray-800 px-4 py-2 rounded-md border border-gray-200">
                {{ item }}
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500 italic">None configured.</p>
          </div>

          <!-- Advanced Settings -->
          <details class="border-t border-gray-200 pt-6 mt-6">
            <summary class="text-lg font-semibold text-gray-800 cursor-pointer">Advanced Settings</summary>
            <!-- Component Lists -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div v-for="list in componentLists.filter(l => l.key !== 'toolNames')" :key="list.title">
                <h3 class="font-semibold text-gray-800 mb-3">{{ list.title }}</h3>
                <ul v-if="agentDef[list.key] && agentDef[list.key].length" class="space-y-2">
                  <li v-for="item in agentDef[list.key]" :key="item" class="text-sm font-mono bg-gray-50 text-gray-800 px-4 py-2 rounded-md border border-gray-200">
                    {{ item }}
                  </li>
                </ul>
                <p v-else class="text-sm text-gray-500 italic">None configured.</p>
              </div>
            </div>
          </details>

        </div>
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

    <!-- Agent Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showDeleteConfirm"
      :item-name="agentDef ? agentDef.name : ''"
      item-type="Agent Definition"
      title="Delete Agent Definition"
      confirm-text="Delete Definition"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />

    <!-- Notification -->
    <div v-if="notification"
        :class="[
          'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white',
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        ]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRefs } from 'vue';
import { useAgentDefinitionStore, type AgentDefinition } from '~/stores/agentDefinitionStore';
import WorkspaceConfigModal from '~/components/workspace/config/WorkspaceConfigModal.vue';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';

const props = defineProps<{ agentId: string }>();
const { agentId } = toRefs(props);

const emit = defineEmits(['navigate']);

const agentDefinitionStore = useAgentDefinitionStore();
const agentDef = computed(() => agentDefinitionStore.getAgentDefinitionById(agentId.value));
const loading = ref(false);

const selectedAgent = ref<AgentDefinition | null>(null);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const showDeleteConfirm = ref(false);
const agentIdToDelete = ref<string | null>(null);

const componentLists = [
  { title: 'Tools', key: 'toolNames' },
  { title: 'Input Processors', key: 'inputProcessorNames' },
  { title: 'LLM Response Processors', key: 'llmResponseProcessorNames' },
  { title: 'System Prompt Processors', key: 'systemPromptProcessorNames' },
  { title: 'Tool Result Processors', key: 'toolExecutionResultProcessorNames' },
  { title: 'Phase Hooks', key: 'phaseHookNames' },
];

onMounted(async () => {
  if (agentDefinitionStore.agentDefinitions.length === 0) {
    loading.value = true;
    await agentDefinitionStore.fetchAllAgentDefinitions();
    loading.value = false;
  }
});

const selectAgentToRun = (agentDef: AgentDefinition) => {
  selectedAgent.value = agentDef;
};

const onWorkspaceCreated = () => {
  selectedAgent.value = null;
  navigateTo('/workspace');
};

const handleDelete = (id: string) => {
  agentIdToDelete.value = id;
  showDeleteConfirm.value = true;
};

const onDeleteConfirmed = async () => {
  if (agentIdToDelete.value) {
    const success = await agentDefinitionStore.deleteAgentDefinition(agentIdToDelete.value);
    if (success) {
      showNotification('Agent definition deleted successfully.', 'success');
      setTimeout(() => emit('navigate', { view: 'list' }), 1500);
    } else {
      showNotification('Failed to delete agent definition.', 'error');
    }
  }
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  agentIdToDelete.value = null;
};

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};
</script>
