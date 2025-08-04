<template>
  <div class="flex flex-col h-full">
    <!-- Tabs Header -->
    <div class="tabs-container flex-shrink-0">
      <div class="flex space-x-1 bg-gray-100 px-1 rounded-t conversation-tabs whitespace-nowrap border-b border-gray-200">
        <div
          v-for="agent in allOpenAgents"
          :key="agent.state.agentId"
          class="flex items-center"
        >
          <button
            :class="[
              'px-4 py-2 rounded-t text-sm font-medium flex items-center',
              agent.state.agentId === currentSelectedAgentId
                ? 'bg-white text-blue-600 border border-gray-200'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
              agent.state.agentId.startsWith('temp-') && 'italic'
            ]"
            @click="handleSelectAgent(agent.state.agentId)"
            :title="getAgentLabel(agent)"
          >
            <span class="truncate max-w-[200px]">{{ getAgentLabel(agent) }}</span>
            <span
              role="button"
              tabindex="0"
              class="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              @click.stop="handleCloseAgent(agent.state.agentId)"
              @keydown.enter.stop="handleCloseAgent(agent.state.agentId)"
              title="Close Agent"
            >
              &times;
            </span>
          </button>
        </div>
      </div>
    </div>
    <!-- Active Agent Content -->
    <div class="flex flex-col flex-grow overflow-y-auto bg-white min-h-0">
      <AgentEventMonitor
        v-if="currentSelectedAgent"
        :conversation="currentSelectedAgent.state.conversation"
        class="flex-grow" 
      />
      <div v-else class="p-4 text-center text-gray-500">
        Select an agent or start a new one.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import AgentEventMonitor from './AgentEventMonitor.vue';
import type { AgentContext } from '~/types/agent/AgentContext';

const agentContextsStore = useAgentContextsStore();
const agentRunStore = useAgentRunStore();
const launchProfileStore = useAgentLaunchProfileStore();

const allOpenAgents = computed(() => agentContextsStore.allOpenAgents);
const currentSelectedAgentId = computed(() => agentContextsStore.selectedAgentId);
const currentSelectedAgent = computed(() => agentContextsStore.selectedAgent);
const activeLaunchProfile = computed(() => launchProfileStore.activeLaunchProfile);

const getAgentLabel = (agent: AgentContext) => {
  if (!activeLaunchProfile.value) return '...';
  if (agent.state.agentId.startsWith('temp-')) {
    return `New - ${activeLaunchProfile.value.name}`;
  }
  const idSuffix = agent.state.agentId.slice(-4).toUpperCase();
  return `${activeLaunchProfile.value.name} - ${idSuffix}`;
};

const handleCloseAgent = async (agentId: string) => {
  try {
    await agentRunStore.closeAgent(agentId, { terminate: true });
  } catch (error) {
    console.error(`Error terminating and closing agent ${agentId}:`, error);
  }
};

const handleSelectAgent = (agentId: string) => {
  agentContextsStore.setSelectedAgentId(agentId);
};
</script>

<style scoped>
.tabs-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

.conversation-tabs {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.conversation-tabs::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.conversation-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-tabs::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
