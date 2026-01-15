<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Local Agents</h1>
          <p class="text-gray-500 mt-1">Access your installed local AI agents</p>
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
          <button @click="$emit('navigate', { view: 'create' })" class="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center">
            Create New Agent
          </button>
        </div>
      </div>

      <!-- Delete Result Message -->
      <div v-if="deleteResult" class="mb-6">
        <div 
          class="p-4 rounded-lg" 
          :class="deleteResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg v-if="deleteResult.success" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">{{ deleteResult.message }}</p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button 
                  @click="clearDeleteResult"
                  class="inline-flex bg-transparent rounded-md p-1.5"
                  :class="deleteResult.success ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'"
                >
                  <span class="sr-only">Dismiss</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Box Search Filter -->
      <div class="mb-6">
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span class="i-heroicons-magnifying-glass-20-solid text-gray-500 w-5 h-5" aria-hidden="true" />
          </div>
          <input
            type="text"
            v-model="searchQuery"
            name="agent-search"
            id="agent-search"
            class="block w-full rounded-lg border-gray-200 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2.5 bg-gray-50 focus:bg-white placeholder-gray-500"
            placeholder="Search agents by name or description..."
          />
        </div>
      </div>

      <div v-if="loading && !reloading" class="text-center py-20">
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

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAgentDefinitionStore, type AgentDefinition } from '~/stores/agentDefinitionStore';
import AgentCard from '~/components/agents/AgentCard.vue';
import { useRunActions } from '~/composables/useRunActions';

const emit = defineEmits(['navigate']);

const agentDefinitionStore = useAgentDefinitionStore();
const { prepareAgentRun } = useRunActions();
const { deleteResult } = storeToRefs(agentDefinitionStore);

const agentDefinitions = computed(() => agentDefinitionStore.agentDefinitions);
const loading = computed(() => agentDefinitionStore.loading);
const error = computed(() => agentDefinitionStore.error);

const searchQuery = ref('');
const reloading = ref(false);

// Timer for auto-dismissing delete notification
let deleteNotificationTimer: number | null = null;

// Watch for delete result and auto-dismiss after 5 seconds
watch(deleteResult, (newResult) => {
  if (newResult) {
    if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
    deleteNotificationTimer = window.setTimeout(() => agentDefinitionStore.clearDeleteResult(), 5000);
  }
});

const clearDeleteResult = () => {
  if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
  agentDefinitionStore.clearDeleteResult();
};

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
});

const handleReload = async () => {
  reloading.value = true;
  try {
    await agentDefinitionStore.reloadAllAgentDefinitions();
  } catch (e) {
    console.error("Failed to reload agents:", e);
    // Optionally show a notification to the user
  } finally {
    reloading.value = false;
  }
};

const viewDetails = (agentId: string) => {
  emit('navigate', { view: 'detail', id: agentId });
};

const runAgent = (agentDef: AgentDefinition) => {
  prepareAgentRun(agentDef);
  navigateTo('/workspace');
};

onBeforeUnmount(() => {
  if (deleteNotificationTimer) clearTimeout(deleteNotificationTimer);
});
</script>
