<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div v-if="activeLaunchProfile" class="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center space-x-3 min-w-0">
        <span class="text-xl">🤖</span>
        <h4 class="text-base font-medium text-gray-800 truncate" :title="headerTitle">{{ headerTitle }}</h4>
        <AgentStatusDisplay v-if="selectedAgent" :phase="selectedAgent.state.currentPhase" />
      </div>
      <WorkspaceHeaderActions @new-agent="createNewAgent" @open-history="openHistoryPanel" />
    </div>
    
    <!-- Tabbed Agent Monitors -->
    <div class="flex-grow min-h-0">
      <AgentEventMonitorTabs />
    </div>

    <!-- History Panel (Modal) -->
    <ConversationHistoryPanel 
      :is-open="isHistoryPanelOpen"
      :conversations="[]"
      @close="isHistoryPanelOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AgentEventMonitorTabs from '~/components/workspace/AgentEventMonitorTabs.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import WorkspaceHeaderActions from '~/components/workspace/WorkspaceHeaderActions.vue';
import AgentStatusDisplay from '~/components/workspace/AgentStatusDisplay.vue';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';

const agentContextsStore = useAgentContextsStore();
const launchProfileStore = useAgentLaunchProfileStore();
const conversationHistoryStore = useConversationHistoryStore();

const isHistoryPanelOpen = ref(false);

const activeLaunchProfile = computed(() => launchProfileStore.activeLaunchProfile);
const selectedAgent = computed(() => agentContextsStore.selectedAgent);

const headerTitle = computed(() => {
  if (selectedAgent.value && activeLaunchProfile.value) {
    const agentState = selectedAgent.value.state;
    const idSuffix = agentState.agentId.slice(-4).toUpperCase();
    
    // For new agents, just use the profile name until a real ID is assigned
    if (agentState.agentId.startsWith('temp-')) {
      return activeLaunchProfile.value.name;
    }
    
    return `${activeLaunchProfile.value.name} - ${idSuffix}`;
  }
  
  if (activeLaunchProfile.value) {
    return activeLaunchProfile.value.name;
  }
  
  return 'Workspace'; // A generic fallback
});

const createNewAgent = () => {
  agentContextsStore.createNewAgentContext();
};

const openHistoryPanel = () => {
  if (activeLaunchProfile.value) {
    conversationHistoryStore.setAgentDefinitionId(activeLaunchProfile.value.agentDefinition.id);
    isHistoryPanelOpen.value = true;
  } else {
    console.error("Cannot open history panel: No active launch profile.");
  }
};
</script>
