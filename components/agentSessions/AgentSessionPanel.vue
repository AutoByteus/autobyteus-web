<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">Agent Sessions</h2>
      <p class="text-sm text-gray-500">Manage your active agent sessions.</p>
    </div>

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto p-4">
      <AgentSessionList
        :sessions="sessions"
        :active-session-id="activeSessionId"
        @select-session="selectSession"
        @delete-session="deleteSession"
      />
    </div>

    <!-- Footer Button -->
    <div class="p-4 border-t border-gray-200">
      <button 
        @click="startNewSession"
        class="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2"></span>
        Start New Agent Session
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAgentSessionStore } from '~/stores/agentSessionStore';
import { useAgentSessionPanelOverlayStore } from '~/stores/agentSessionPanelOverlayStore';
import AgentSessionList from './AgentSessionList.vue';

const router = useRouter();
const sessionStore = useAgentSessionStore();
const panelStore = useAgentSessionPanelOverlayStore();

const sessions = computed(() => sessionStore.activeSessionList);
const { activeSessionId } = storeToRefs(sessionStore);

const selectSession = (sessionId: string) => {
  sessionStore.setActiveSession(sessionId);
  panelStore.close(); // Close the panel on selection
};

const deleteSession = (sessionId: string) => {
  sessionStore.deleteSession(sessionId);
};

const startNewSession = () => {
  router.push('/agents');
  panelStore.close();
};
</script>
