<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center space-x-3 min-w-0">
        <span class="text-xl">👥</span>
        <h4 v-if="activeLaunchProfile" class="text-base font-medium text-gray-800 truncate" :title="activeLaunchProfile.name">
          {{ activeLaunchProfile.name }}
        </h4>
        <TeamStatusDisplay v-if="activeTeamContext" :status="activeTeamContext.currentStatus" />
      </div>
      <WorkspaceHeaderActions @new-agent="createNewTeamInstance" @open-history="openHistoryPanel" />
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

    <!-- History Panel (Modal) -->
    <ConversationHistoryPanel
      :is-open="isHistoryPanelOpen"
      @close="isHistoryPanelOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import TeamStatusDisplay from '~/components/workspace/team/TeamStatusDisplay.vue';
import AgentTeamEventMonitorTabs from '~/components/workspace/team/AgentTeamEventMonitorTabs.vue';
import AgentTeamEventMonitor from '~/components/workspace/team/AgentTeamEventMonitor.vue';
import WorkspaceHeaderActions from '~/components/workspace/common/WorkspaceHeaderActions.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import { useConversationHistoryStore } from '~/stores/conversationHistory';

const teamLaunchProfileStore = useAgentTeamLaunchProfileStore();
const teamRunStore = useAgentTeamRunStore();
const teamContextsStore = useAgentTeamContextsStore();
const conversationHistoryStore = useConversationHistoryStore();

const isHistoryPanelOpen = ref(false);

const activeLaunchProfile = computed(() => teamLaunchProfileStore.activeLaunchProfile);
const activeTeamContext = computed(() => teamContextsStore.activeTeamContext);
const focusedMember = computed(() => teamContextsStore.focusedMemberContext);

const createNewTeamInstance = () => {
  // Call the simple, stateless action to create a new instance based on the active environment
  teamRunStore.createNewTeamInstance();
};

const openHistoryPanel = () => {
  if (focusedMember.value) {
    const agentDefId = focusedMember.value.state.conversation.agentDefinitionId;
    if (agentDefId) {
      conversationHistoryStore.setAgentDefinitionId(agentDefId);
      isHistoryPanelOpen.value = true;
    } else {
      console.error("Cannot open history panel: Focused member does not have an agentDefinitionId.");
      // Here you could add a user-facing notification if desired
    }
  } else {
    console.error("Cannot open history panel: No agent is focused in the team view.");
  }
};
</script>
