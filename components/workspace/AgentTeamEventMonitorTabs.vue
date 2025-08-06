<template>
  <div class="tabs-container flex-shrink-0">
    <div class="flex space-x-1 bg-gray-100 px-1 team-instance-tabs whitespace-nowrap border-b border-gray-200">
      <div
        v-for="team in allTeamInstances"
        :key="team.teamId"
        class="flex items-center"
      >
        <button
          :class="[
            'px-4 py-2 rounded-t text-sm font-medium flex items-center',
            team.teamId === currentSelectedTeamId
              ? 'bg-white text-purple-600 border-x border-t border-gray-200'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
          ]"
          @click="handleSelectTeam(team.teamId)"
          :title="getTabTitle(team)"
        >
          <span class="truncate max-w-[200px]">{{ getTabLabel(team) }}</span>
          <span
            role="button"
            tabindex="0"
            class="ml-2 text-gray-500 hover:text-red-600 cursor-pointer"
            @click.stop="handleCloseTeam(team.teamId)"
            @keydown.enter.stop="handleCloseTeam(team.teamId)"
            title="Terminate Team Instance"
          >
            &times;
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

const teamContextsStore = useAgentTeamContextsStore();
const teamRunStore = useAgentTeamRunStore();

const allTeamInstances = computed(() => teamContextsStore.allTeamInstances);
const currentSelectedTeamId = computed(() => teamContextsStore.selectedTeamId);

const getTabLabel = (team: AgentTeamContext) => {
  const idSuffix = team.teamId.slice(-6).toUpperCase();
  return `Instance ${idSuffix}`;
};

const getTabTitle = (team: AgentTeamContext) => {
  return `Team Instance ID: ${team.teamId}`;
};

const handleCloseTeam = async (teamId: string) => {
  if (confirm(`Are you sure you want to terminate instance ${teamId.slice(-6).toUpperCase()}?`)) {
    await teamRunStore.terminateTeamInstance(teamId);
  }
};

const handleSelectTeam = (teamId: string) => {
  teamContextsStore.setSelectedTeamId(teamId);
};
</script>

<style scoped>
.tabs-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

.team-instance-tabs {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.team-instance-tabs::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.team-instance-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.team-instance-tabs::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
