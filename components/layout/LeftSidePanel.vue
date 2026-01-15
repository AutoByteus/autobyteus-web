<template>
  <div class="h-full flex flex-col bg-white overflow-hidden relative">
    <!-- ACCORDION: RUNNING AGENTS -->
    <div class="flex-shrink-0 border-b border-gray-200">
      <div class="flex items-center justify-between bg-white hover:bg-gray-50 transition-colors group select-none pr-2">
        <button 
          @click="toggleSection('running')"
          class="flex-1 flex items-center px-3 py-3 text-sm font-medium text-gray-800 focus:outline-none"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            class="mr-2 text-gray-500 group-hover:text-gray-900 transition-transform duration-200 transform"
            :class="activeSections.has('running') ? '' : '-rotate-90'"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          Running Agents
        </button>
        
        <button 
          @click.stop="closePanel"
          class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          title="Collapse Panel"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </button>
      </div>
    </div>
    <div 
      v-if="activeSections.has('running')"
      class="flex-1 overflow-hidden flex flex-col min-h-0"
    >
      <div class="flex-1 overflow-auto">
        <RunningAgentsPanel />
      </div>
    </div>



    <!-- ACCORDION: CONFIGURATION -->
    <div class="flex-shrink-0">
      <button 
        @click="toggleSection('config')"
        class="w-full flex items-center px-3 py-3 bg-white hover:bg-gray-50 border-b border-gray-200 border-t text-sm font-medium text-gray-800 transition-colors focus:outline-none group select-none"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          class="mr-2 text-gray-500 group-hover:text-gray-900 transition-transform duration-200 transform"
          :class="activeSections.has('config') ? '' : '-rotate-90'"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        {{ configTitle }}
      </button>
    </div>
    <div 
      v-if="activeSections.has('config')"
      class="flex-1 overflow-hidden flex flex-col min-h-0"
    >
      <div class="h-full overflow-auto">
        <RunConfigPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import RunningAgentsPanel from '~/components/workspace/running/RunningAgentsPanel.vue'
import RunConfigPanel from '~/components/workspace/config/RunConfigPanel.vue'
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore'
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';

const layoutStore = useWorkspaceLeftPanelLayoutStore()
const selectionStore = useAgentSelectionStore();
const runConfigStore = useAgentRunConfigStore();
const teamRunConfigStore = useTeamRunConfigStore();
const contextsStore = useAgentContextsStore();
const teamContextsStore = useAgentTeamContextsStore();

const closePanel = () => {
  layoutStore.closePanel('running')
}

// Mode Detection & Title Logic
const isSelectionMode = computed(() => !!selectionStore.selectedInstanceId);

const effectiveAgentConfig = computed(() => {
    if (selectionStore.isAgentSelected && selectionStore.selectedInstanceId) {
        return contextsStore.activeInstance?.config || null;
    }
    if (!isSelectionMode.value && runConfigStore.config?.agentDefinitionId) {
        return runConfigStore.config;
    }
    return null;
});

const effectiveTeamConfig = computed(() => {
    if (selectionStore.isTeamSelected && selectionStore.selectedInstanceId) {
        return teamContextsStore.activeTeamContext?.config || null;
    }
    if (!isSelectionMode.value && teamRunConfigStore.config?.teamDefinitionId) {
        return teamRunConfigStore.config;
    }
    return null;
});

const configTitle = computed(() => {
    if (effectiveAgentConfig.value) return 'Agent Configuration';
    if (effectiveTeamConfig.value) return 'Team Configuration';
    return 'Configuration';
});

// Accordion State
const activeSections = reactive(new Set(['running', 'config']));

const toggleSection = (section: string) => {
  if (activeSections.has(section)) {
    activeSections.delete(section);
  } else {
    activeSections.add(section);
  }
};
</script>
