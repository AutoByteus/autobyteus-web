<template>
  <div class="h-full bg-white font-sans">
    <ResponsiveMasterDetail sidebar-width="w-56">
      <!-- Sidebar Slot: Secondary Navigation -->
      <template #sidebar>
        <div class="flex flex-col h-full">
          <!-- Header for Sidebar -->
          <div class="h-16 flex items-center px-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h1 class="text-lg font-bold text-gray-800">AI Agents</h1>
          </div>
          
          <!-- Navigation Links -->
          <nav class="flex-1 px-2 py-4 space-y-1 lg:space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible space-x-2 lg:space-x-0">
            <button
              @click="handleNavigation({ view: 'list' })"
              class="flex items-center flex-shrink-0 lg:w-full px-3 py-2 text-sm font-semibold rounded-md text-left transition-colors whitespace-nowrap"
              :class="isLocalAgentsActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'"
            >
              Local Agents
            </button>
            <button
              @click="handleNavigation({ view: 'team-list' })"
              class="flex items-center flex-shrink-0 lg:w-full px-3 py-2 text-sm font-semibold rounded-md text-left transition-colors whitespace-nowrap"
              :class="isAgentTeamsActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'"
            >
              Agent Teams
            </button>
            <a href="#" class="flex items-center flex-shrink-0 px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed whitespace-nowrap">
              Running Agents
            </a>
            <a href="#" class="flex items-center flex-shrink-0 px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed whitespace-nowrap">
              Agent Marketplace
            </a>
          </nav>
        </div>
      </template>

      <!-- Content Slot: Main View -->
      <template #content>
        <div v-if="loading" class="h-full w-full flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-lg text-gray-600">Preparing Agent Manager...</p>
          </div>
        </div>
        <div v-else class="h-full w-full">
          <!-- Local Agent Views -->
          <AgentList v-if="currentView === 'list'" @navigate="handleNavigation" />
          <AgentCreate v-else-if="currentView === 'create'" @navigate="handleNavigation" />
          <AgentDetail v-else-if="currentView === 'detail' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
          <AgentEdit v-else-if="currentView === 'edit' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
          
          <!-- Agent Team Views -->
          <AgentTeamList v-else-if="currentView === 'team-list'" @navigate="handleNavigation" />
          <AgentTeamCreate v-else-if="currentView === 'team-create'" @navigate="handleNavigation" />
          <AgentTeamDetail v-else-if="currentView === 'team-detail' && currentId" :team-id="currentId" @navigate="handleNavigation" />
          <AgentTeamEdit v-else-if="currentView === 'team-edit' && currentId" :team-id="currentId" @navigate="handleNavigation" />
    
          <!-- Fallback -->
          <div v-else class="p-8">
            <h1 class="text-xl font-bold">Invalid View</h1>
            <p>The requested view is not available.</p>
            <button @click="handleNavigation({ view: 'list' })" class="mt-4 text-indigo-600 hover:underline">Go to Agents</button>
          </div>
        </div>
      </template>
    </ResponsiveMasterDetail>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
// Local Agent Components
import AgentList from '~/components/agents/AgentList.vue';
import AgentDetail from '~/components/agents/AgentDetail.vue';
import AgentCreate from '~/components/agents/AgentCreate.vue';
import AgentEdit from '~/components/agents/AgentEdit.vue';
// Agent Team Components
import AgentTeamList from '~/components/agentTeams/AgentTeamList.vue';
import AgentTeamDetail from '~/components/agentTeams/AgentTeamDetail.vue';
import AgentTeamCreate from '~/components/agentTeams/AgentTeamCreate.vue';
import AgentTeamEdit from '~/components/agentTeams/AgentTeamEdit.vue';
import ResponsiveMasterDetail from '~/components/layout/ResponsiveMasterDetail.vue';


const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const agentDefStore = useAgentDefinitionStore();
const agentTeamDefStore = useAgentTeamDefinitionStore();

const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  try {
    // Pre-fetch all essential data for the agents section concurrently.
    await Promise.all([
      workspaceStore.fetchAllWorkspaces(),
      agentDefStore.fetchAllAgentDefinitions(),
      agentTeamDefStore.fetchAllAgentTeamDefinitions(),
    ]);
  } catch (error) {
    console.error("Failed to fetch initial data for agents page:", error);
    // Optionally show an error message to the user
  } finally {
    loading.value = false;
  }
});

type View = 
  'list' | 'detail' | 'create' | 'edit' | 
  'team-list' | 'team-detail' | 'team-create' | 'team-edit';

const currentView = computed((): View => {
  const view = route.query.view as View;
  const validViews: View[] = [
    'list', 'detail', 'create', 'edit',
    'team-list', 'team-detail', 'team-create', 'team-edit'
  ];
  if (view && validViews.includes(view)) {
    return view;
  }
  return 'list'; // Default view
});

const currentId = computed(() => route.query.id as string | undefined);

const isLocalAgentsActive = computed(() => {
  return ['list', 'detail', 'create', 'edit'].includes(currentView.value);
});

const isAgentTeamsActive = computed(() => {
  return ['team-list', 'team-detail', 'team-create', 'team-edit'].includes(currentView.value);
});

const handleNavigation = (payload: { view: View; id?: string }) => {
  const { view, id } = payload;
  const query: any = { view };
  if (id) {
    query.id = id;
  }
  router.push({ path: '/agents', query });
};
</script>
