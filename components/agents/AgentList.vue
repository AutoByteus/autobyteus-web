<template>
  <div class="h-full flex-1 overflow-auto bg-slate-50">
    <div class="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-4xl font-semibold text-slate-900">Agents</h1>
          <p class="mt-1 text-lg text-slate-600">Access your installed AI agents</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleReload"
            :disabled="reloading"
            class="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :class="[
              reloading
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" :class="{'animate-spin': reloading}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ reloading ? 'Reloading...' : 'Reload' }}
          </button>
          <button
            @click="$emit('navigate', { view: 'create' })"
            class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Create Agent
          </button>
        </div>
      </div>

      <div v-if="deleteResult" class="mb-6">
        <div 
          class="rounded-lg border-l-4 p-4 shadow-sm" 
          :class="deleteResult.success ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'"
        >
          <div class="flex items-start gap-3">
            <div class="shrink-0">
              <svg v-if="deleteResult.success" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium">{{ deleteResult.message }}</p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button 
                  @click="clearDeleteResult"
                  class="inline-flex rounded-md bg-transparent p-1.5"
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

      <div class="mb-6">
        <div class="relative rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 3a6 6 0 104.472 10.001l2.763 2.764a1 1 0 001.414-1.414l-2.764-2.763A6 6 0 009 3zm-4 6a4 4 0 118 0 4 4 0 01-8 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            v-model="searchQuery"
            name="agent-search"
            id="agent-search"
            class="block w-full rounded-lg border-transparent bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search agents by name or description..."
          />
        </div>
      </div>

      <div v-if="loading && !reloading" class="rounded-lg border border-slate-200 bg-white py-20 text-center shadow-sm">
        <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="text-slate-600">Loading agent definitions...</p>
      </div>
      <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p class="font-bold">Error loading agent definitions:</p>
        <p>{{ error.message }}</p>
      </div>

      <div v-else-if="filteredAgentDefinitions.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AgentCard
          v-for="agentDef in filteredAgentDefinitions"
          :key="agentDef.id"
          :agent-def="agentDef"
          @view-details="viewDetails"
          @run-agent="runAgent"
        />
      </div>

      <div v-else class="rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
        <div class="text-slate-500">
          <svg class="mx-auto mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7a4 4 0 014 4c0 1.37-.69 2.62-1.84 3.38-.42.28-.66.77-.66 1.28V17a1 1 0 01-1 1h-1.5a1 1 0 01-1-1v-1.34c0-.51-.25-1-.66-1.28A4 4 0 018 11a4 4 0 014-4zm-3 12h6M10 5.5a2 2 0 114 0" />
          </svg>
          <p class="mb-2 text-lg font-medium">No agents found</p>
          <p class="text-slate-400">
            {{ searchQuery.trim() ? `No agents matched "${searchQuery}"` : 'Create a new agent to get started.' }}
          </p>
        </div>
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
  return agentDefinitions.value.filter((agent) => {
    const name = agent.name?.toLowerCase() ?? '';
    const description = agent.description?.toLowerCase() ?? '';
    const tools = (agent.toolNames ?? []).join(' ').toLowerCase();
    const skills = (agent.skillNames ?? []).join(' ').toLowerCase();
    return (
      name.includes(lowerCaseQuery)
      || description.includes(lowerCaseQuery)
      || tools.includes(lowerCaseQuery)
      || skills.includes(lowerCaseQuery)
    );
  });
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
