<template>
  <div class="flex flex-col h-full">
    <!-- Tabs Header -->
    <div class="tabs-container flex-shrink-0">
      <div class="flex items-center gap-1 bg-white px-2 conversation-tabs whitespace-nowrap border-b border-gray-100">
        <div
          v-for="agent in allOpenAgents"
          :key="agent.state.agentId"
          class="flex items-center"
        >
          <button
            :class="[
              'px-3 py-2 text-sm font-medium flex items-center transition-colors duration-150 border-b-2 -mb-px',
              agent.state.agentId === currentSelectedAgentId
                ? 'text-blue-700 border-blue-500 bg-blue-50/60 rounded-t-md'
                : 'text-gray-500 border-transparent hover:text-gray-700',
              agent.state.agentId.startsWith('temp-') && 'italic'
            ]"
            @click="handleSelectAgent(agent.state.agentId)"
            :title="getAgentLabel(agent)"
          >
            <span class="truncate max-w-[200px]">{{ getAgentLabel(agent) }}</span>
            <span
              role="button"
              tabindex="0"
              class="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer text-sm leading-none"
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
        :agent-name="currentSelectedAgent.config.agentDefinitionName"
        :agent-avatar-url="currentSelectedAgent.config.agentAvatarUrl"
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
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import AgentEventMonitor from './AgentEventMonitor.vue';
import type { AgentContext } from '~/types/agent/AgentContext';

const agentContextsStore = useAgentContextsStore();
const agentRunStore = useAgentRunStore();
const selectionStore = useAgentSelectionStore();

const allOpenAgents = computed(() => agentContextsStore.allInstances);
const currentSelectedAgentId = computed(() => selectionStore.selectedType === 'agent' ? selectionStore.selectedInstanceId : null);
const currentSelectedAgent = computed(() => agentContextsStore.activeInstance);

const getAgentLabel = (agent: AgentContext) => {
  const name = agent.config.agentDefinitionName || 'Agent';
  if (agent.state.agentId.startsWith('temp-')) {
    return `New - ${name}`;
  }
  const idSuffix = agent.state.agentId.slice(-4).toUpperCase();
  return `${name} - ${idSuffix}`;
};

const handleCloseAgent = async (agentId: string) => {
  try {
    await agentRunStore.closeAgent(agentId, { terminate: true });
  } catch (error) {
    console.error(`Error terminating and closing agent ${agentId}:`, error);
  }
};

const handleSelectAgent = (agentId: string) => {
  selectionStore.selectInstance(agentId, 'agent');
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
