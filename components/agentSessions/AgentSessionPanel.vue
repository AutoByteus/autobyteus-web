<template>
  <div class="agent-session-panel h-full flex flex-col p-4">
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">Agent Sessions</h2>
      <p class="text-sm text-gray-500">Manage your active agent sessions.</p>
    </div>

    <div class="flex-1 overflow-y-auto -mx-2">
      <AgentSessionList />
    </div>

    <div class="mt-4 pt-4">
      <button
        @click="startNewSession"
        class="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        + Start New Agent Session
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AgentSessionList from '~/components/agentSessions/AgentSessionList.vue';
import { useAgentSessionPanelOverlayStore } from '~/stores/agentSessionPanelOverlayStore';

const router = useRouter();
const agentSessionPanelOverlayStore = useAgentSessionPanelOverlayStore();

const startNewSession = () => {
  agentSessionPanelOverlayStore.close();
  router.push('/');
};
</script>
