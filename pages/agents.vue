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
        <a href="#" class="flex items-center px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
          Running Agents
        </a>
        <a href="#" class="flex items-center px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
          Agent Marketplace
        </a>
        <a href="#" class="flex items-center px-3 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
          Workflows
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto">
      <LaunchProfileManager v-if="currentView === 'launch-profiles'" @navigate="handleNavigation" />
      <AgentList v-else-if="currentView === 'list'" @navigate="handleNavigation" />
      <RunningAgentList v-else-if="currentView === 'remote-agents'" @navigate="handleNavigation" />
      <AgentCreate v-else-if="currentView === 'create'" @navigate="handleNavigation" />
      <AgentDetail v-else-if="currentView === 'detail' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
      <AgentEdit v-else-if="currentView === 'edit' && currentId" :agent-id="currentId" @navigate="handleNavigation" />
      <div v-else class="p-8">
        <h1 class="text-xl font-bold">Invalid View</h1>
        <p>The requested view is not available.</p>
        <button @click="handleNavigation({ view: 'launch-profiles' })" class="mt-4 text-indigo-600 hover:underline">Go to Launch Profiles</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LaunchProfileManager from '~/components/agents/LaunchProfileManager.vue';
import AgentList from '~/components/agents/AgentList.vue';
import AgentDetail from '~/components/agents/AgentDetail.vue';
import AgentCreate from '~/components/agents/AgentCreate.vue';
import AgentEdit from '~/components/agents/AgentEdit.vue';
import RunningAgentList from '~/components/agents/RunningAgentList.vue';

const route = useRoute();
const router = useRouter();

type View = 'list' | 'detail' | 'create' | 'edit' | 'launch-profiles' | 'remote-agents';

const currentView = computed((): View => {
  const view = route.query.view as View;
  const validViews = ['list', 'detail', 'create', 'edit', 'launch-profiles']; // 'remote-agents' is removed
  if (view && validViews.includes(view)) {
    return view;
  }
  return 'launch-profiles'; // Default view is now 'launch-profiles'
});

const currentId = computed(() => route.query.id as string | undefined);

const isLocalAgentsActive = computed(() => {
  // The "Local Agents" menu is active for list, detail, create, and edit views.
  return ['list', 'detail', 'create', 'edit'].includes(currentView.value);
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
