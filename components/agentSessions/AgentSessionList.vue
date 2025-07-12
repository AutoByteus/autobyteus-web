<template>
  <div class="space-y-2">
    <div 
      v-for="session in sessions" 
      :key="session.sessionId"
      @click="$emit('select-session', session.sessionId)"
      class="p-3 rounded-lg border cursor-pointer transition-all duration-150"
      :class="isActive(session.sessionId) 
        ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
    >
      <div class="flex justify-between items-start">
        <div>
          <p class="font-medium text-gray-900 break-words">{{ session.name }}</p>
          <p class="text-xs text-gray-500 mt-1">
            Created: {{ new Date(session.createdAt).toLocaleString() }}
          </p>
        </div>
        <button 
          @click.stop="$emit('delete-session', session.sessionId)" 
          class="ml-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
          title="Delete Session"
        >
          <span class="i-heroicons-x-mark-20-solid w-5 h-5"></span>
        </button>
      </div>
    </div>
    <div v-if="sessions && sessions.length === 0" class="text-center text-gray-500 pt-10">
      <p>No active sessions.</p>
      <p class="text-sm">Start a new one from the Agents page.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import type { AgentSession } from '~/stores/agentSessionStore';

const props = defineProps<{  sessions: AgentSession[];
  activeSessionId: string | null;
}>();

defineEmits(['select-session', 'delete-session']);

const { sessions, activeSessionId } = toRefs(props);

const isActive = (sessionId: string) => {
  return activeSessionId.value === sessionId;
};
</script>
