<template>
  <div class="flex h-full bg-white font-sans">
    <!-- Secondary Sidebar -->
    <aside class="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div class="h-16 flex items-center px-4">
        <h1 class="text-lg font-bold text-gray-800">AI Agents</h1>
      </div>
      <nav class="flex-1 px-2 py-4 space-y-1">
        <button
          @click="handleNavigation({ view: 'launch-profiles' })"
          class="flex items-center w-full px-3 py-2 text-sm font-semibold rounded-md text-left transition-colors"
          :class="currentView === 'launch-profiles' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'"
        >
          Launch Profiles
        </button>
        <button
          @click="handleNavigation({ view: 'list' })"
          class="flex items-center w-full px-3 py-2 text-sm font-semibold rounded-md text-left transition-colors"
          :class="isLocalAgentsActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'"
        >
          Local Agents
        </button>
        <button
          @click="handleNavigation({ view: 'team-list' })"
          class="flex items-center w-full px-3 py-2 text-sm font-semibold rounded-md text-left transition-colors"
          :class="isAgentTeamsActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'"
        >
          Agent Teams
        </button>
        <a href="#" class="flex items-center px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
          Running Agents
        </a>
        <a href="#" class="flex items-center px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
          Agent Marketplace
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main v-if="loading" class="flex-1 overflow-y-auto flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-lg text-gray-600">Preparing Agent Manager...</p>
      </div>
    </main>
    <main v-else class="flex-1 overflow-y-auto">
      <!-- Local Agent Views -->
      <AgentList v-if="currentView === 'list'" @navigate="handleNavigation" />
      <AgentCreate v-else-if="currentView === 'create'" @navigate="handleNavigation" />
      <AgentDetail v-else-if="currentView === 'detail' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
      <AgentEdit v-else-if="currentView === 'edit' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
      
      <!-- Launch Profile View -->
      <LaunchProfileManager v-else-if="currentView === 'launch-profiles'" @navigate="handleNavigation" />

      <!-- Agent Team Views -->
      <AgentTeamList v-else-if="currentView === 'team-list'" @navigate="handleNavigation" />
      <AgentTeamCreate v-else-if="currentView === 'team-create'" @navigate="handleNavigation" />
      <AgentTeamDetail v-else-if="currentView === 'team-detail' && currentId" :team-id="currentId" @navigate="handleNavigation" />
      <AgentTeamEdit v-else-if="currentView === 'team-edit' && currentId" :team-id="currentId" @navigate="handleNavigation" />

      <!-- Fallback -->
      <div v-else class="p-8">
        <h1 class="text-xl font-bold">Invalid View</h1>
        <p>The requested view is not available.</p>
        <button @click="handleNavigation({ view: 'launch-profiles' })" class="mt-4 text-indigo-600 hover:underline">Go to Launch Profiles</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import LaunchProfileManager from '~/components/launchProfiles/LaunchProfileManager.vue';
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
  'launch-profiles' | 
  'team-list' | 'team-detail' | 'team-create' | 'team-edit';

const currentView = computed((): View => {
  const view = route.query.view as View;
  const validViews: View[] = [
    'list', 'detail', 'create', 'edit',
    'launch-profiles',
    'team-list', 'team-detail', 'team-create', 'team-edit'
  ];
  if (view && validViews.includes(view)) {
    return view;
  }
  return 'launch-profiles'; // Default view
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
