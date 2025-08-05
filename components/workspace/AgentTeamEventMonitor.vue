<template>
  <div class="h-full">
    <AgentEventMonitor
      v-if="conversationOfFocusedMember"
      :conversation="conversationOfFocusedMember"
      class="h-full"
    />
    <div v-else class="p-8 text-center text-gray-500 h-full flex items-center justify-center">
      <div v-if="!activeTeam">
        <p>No active team session.</p>
      </div>
      <div v-else-if="!focusedMember">
         <p>Select a team member from the panel to view their activity.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import AgentEventMonitor from '~/components/workspace/AgentEventMonitor.vue';

const teamContextsStore = useAgentTeamContextsStore();

const activeTeam = computed(() => teamContextsStore.activeTeamContext);
const focusedMember = computed(() => teamContextsStore.focusedMemberContext);
const conversationOfFocusedMember = computed(() => focusedMember.value?.state.conversation);
</script>
