<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div v-if="selectedAgent" class="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center space-x-3 min-w-0">
        <span class="text-xl">🤖</span>
        <h4 class="text-base font-medium text-gray-800 truncate" :title="headerTitle">{{ headerTitle }}</h4>
        <AgentStatusDisplay v-if="selectedAgent" :status="selectedAgent.state.currentStatus" />
      </div>
      
      <div class="flex items-center space-x-2">
        <CopyButton 
          v-if="selectedAgent" 
          :text-to-copy="conversationText" 
          label="Copy full conversation"
        />
        <!-- Separator removed -->
        <WorkspaceHeaderActions @new-agent="createNewAgent" @open-history="openHistoryPanel" />
      </div>
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
import AgentEventMonitorTabs from '~/components/workspace/agent/AgentEventMonitorTabs.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import WorkspaceHeaderActions from '~/components/workspace/common/WorkspaceHeaderActions.vue';
import AgentStatusDisplay from '~/components/workspace/agent/AgentStatusDisplay.vue';
import CopyButton from '~/components/common/CopyButton.vue';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';

const agentContextsStore = useAgentContextsStore();
const runConfigStore = useAgentRunConfigStore();
const selectionStore = useAgentSelectionStore();
const conversationHistoryStore = useConversationHistoryStore();

const isHistoryPanelOpen = ref(false);

const selectedAgent = computed(() => agentContextsStore.activeInstance);

const headerTitle = computed(() => {
  if (selectedAgent.value) {
    const agentState = selectedAgent.value.state;
    const name = selectedAgent.value.config.agentDefinitionName || 'Agent';
    if (agentState.agentId.startsWith('temp-')) {
      return `New - ${name}`;
    }
    const idSuffix = agentState.agentId.slice(-4).toUpperCase();
    return `${name} - ${idSuffix}`;
  }
  return 'Workspace'; // A generic fallback
});

const conversationText = computed(() => {
  if (!selectedAgent.value) return '';
  return selectedAgent.value.state.conversation.messages
    .map(m => {
      // Changed 'Agent' to 'Assistant' to match LLM chat templates
      const role = m.type === 'user' ? 'User' : 'Assistant';
      // Ensure text exists
      const content = m.text || ''; 
      return `${role}:\n${content}`;
    })
    .join('\n\n');
});

const createNewAgent = () => {
  if (selectedAgent.value) {
    const template = { ...selectedAgent.value.config, isLocked: false };
    runConfigStore.setAgentConfig(template);
  }
  selectionStore.clearSelection();
  agentContextsStore.createInstanceFromTemplate();
};

const openHistoryPanel = () => {
  if (selectedAgent.value?.config.agentDefinitionId) {
    conversationHistoryStore.setAgentDefinitionId(selectedAgent.value.config.agentDefinitionId);
    isHistoryPanelOpen.value = true;
  } else {
    console.error("Cannot open history panel: No active agent selected.");
  }
};
</script>
