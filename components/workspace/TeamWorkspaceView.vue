<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div v-if="activeTeam" class="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center space-x-3 min-w-0">
        <span class="text-xl">👥</span>
        <h4 class="text-base font-medium text-gray-800 truncate" :title="activeTeam.launchProfile.name">
          {{ activeTeam.launchProfile.name }}
        </h4>
        <TeamStatusDisplay :phase="activeTeam.currentPhase" />
      </div>
      <!-- Actions could go here in the future -->
    </div>
    
    <!-- Main Content: The event monitor for the focused member -->
    <div class="flex-grow min-h-0">
      <AgentTeamEventMonitor />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import TeamStatusDisplay from '~/components/workspace/TeamStatusDisplay.vue';
import AgentTeamEventMonitor from '~/components/workspace/AgentTeamEventMonitor.vue';

const teamContextsStore = useAgentTeamContextsStore();
const activeTeam = computed(() => teamContextsStore.activeTeamContext);
</script>
