<template>
  <div class="agent-session-list p-2 space-y-2">
    <div v-if="sessions.length === 0" class="text-center text-gray-500 py-4">
      No active sessions.
    </div>
    <div
      v-for="session in sessions"
      :key="session.sessionId"
      @click="activateSession(session.sessionId)"
      class="p-3 rounded-lg cursor-pointer transition-colors duration-150 border bg-white"
      :class="session.sessionId === activeSessionId 
        ? 'border-indigo-500 text-indigo-800 ring-1 ring-indigo-500' 
        : 'border-gray-200 hover:bg-gray-50'"
    >
      <div class="flex justify-between items-center">
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">{{ session.name }}</p>
          <p 
            class="text-xs" 
            :class="session.sessionId === activeSessionId ? 'text-indigo-400' : 'text-gray-500'"
          >
            Created: {{ new Date(session.createdAt).toLocaleString() }}
          </p>
        </div>
        <button
          @click.stop="deleteSession(session.sessionId)"
          class="ml-2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Delete Session"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentSessionStore } from '~/stores/agentSessionStore';

const sessionStore = useAgentSessionStore();

const sessions = computed(() => sessionStore.sessionList);
const activeSessionId = computed(() => sessionStore.activeSessionId);

const activateSession = (sessionId: string) => {
  sessionStore.setActiveSession(sessionId);
};

const deleteSession = (sessionId: string) => {
  if (confirm('Are you sure you want to delete this session?')) {
    sessionStore.deleteSession(sessionId);
  }
};

onMounted(() => {
  sessionStore.loadSessions();
});
</script>
