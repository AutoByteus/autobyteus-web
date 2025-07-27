<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Bar -->
    <div v-if="activeLaunchProfile" class="flex items-center justify-between px-3 pt-1 pb-0 border-b border-gray-200 flex-shrink-0">
      <h4 class="text-lg font-medium text-gray-700 truncate">{{ activeLaunchProfile.name }}</h4>
      <div class="flex items-center space-x-2">
        <button 
          @click="createNewAgent" 
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-500 tooltip transition-colors"
          aria-label="New Agent"
          data-tooltip="New Agent"
        >
          <PlusCircleIcon class="w-6 h-6" />
        </button>
        <button 
          @click="openHistoryPanel" 
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 tooltip transition-colors"
          aria-label="History"
          data-tooltip="History"
        >
          <ClockIcon class="w-6 h-6" />
        </button>
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
import AgentEventMonitorTabs from '~/components/workspace/AgentEventMonitorTabs.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { PlusCircleIcon, ClockIcon } from '@heroicons/vue/24/solid';

const agentRunStore = useAgentRunStore();
const launchProfileStore = useAgentLaunchProfileStore();
const conversationHistoryStore = useConversationHistoryStore();

const isHistoryPanelOpen = ref(false);

const activeLaunchProfile = computed(() => launchProfileStore.activeLaunchProfile);

const createNewAgent = () => {
  agentRunStore.createNewAgent();
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

<style scoped>
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px; 
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}
</style>
