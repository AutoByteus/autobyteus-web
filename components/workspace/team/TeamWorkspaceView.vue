<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center space-x-3 min-w-0">
        <span class="text-xl">👥</span>
        <h4 v-if="activeTeamContext" class="text-base font-medium text-gray-800 truncate" :title="activeTeamContext.config.teamDefinitionName">
          {{ activeTeamContext.config.teamDefinitionName }}
        </h4>
        <TeamStatusDisplay v-if="activeTeamContext" :status="activeTeamContext.currentStatus" />
      </div>
      <WorkspaceHeaderActions @new-agent="createNewTeamInstance" />
    </div>

    <!-- Tabs for team instances -->
    <AgentTeamEventMonitorTabs />
    
    <!-- Main Content Area -->
    <div v-if="activeTeamContext" class="flex-grow min-h-0">
      <!-- The Event Monitor now takes up the full space -->
      <AgentTeamEventMonitor />
    </div>
    
    <!-- Empty State when no instances are running -->
    <div v-else class="flex-grow flex items-center justify-center p-8 text-center text-gray-500 bg-gray-50">
      <div>
        <h3 class="text-lg font-medium text-gray-900">No Active Team Instances</h3>
        <p class="mt-2 max-w-md mx-auto">
          This team profile has no running instances. Click the "New" button in the header to launch one.
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import TeamStatusDisplay from '~/components/workspace/team/TeamStatusDisplay.vue';
import AgentTeamEventMonitorTabs from '~/components/workspace/team/AgentTeamEventMonitorTabs.vue';
import AgentTeamEventMonitor from '~/components/workspace/team/AgentTeamEventMonitor.vue';
import WorkspaceHeaderActions from '~/components/workspace/common/WorkspaceHeaderActions.vue';

const teamContextsStore = useAgentTeamContextsStore();
const teamRunConfigStore = useTeamRunConfigStore();
const selectionStore = useAgentSelectionStore();

const activeTeamContext = computed(() => teamContextsStore.activeTeamContext);

const createNewTeamInstance = () => {
  if (activeTeamContext.value) {
    const template = JSON.parse(JSON.stringify(activeTeamContext.value.config));
    template.isLocked = false;
    teamRunConfigStore.setConfig(template);
    selectionStore.clearSelection();
    teamContextsStore.createInstanceFromTemplate();
  }
};
</script>
