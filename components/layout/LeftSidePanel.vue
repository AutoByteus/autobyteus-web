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
      class="overflow-hidden flex flex-col min-h-0"
      :class="{ 'flex-1': !activeSections.has('config') }"
      :style="activeSections.has('config') ? { height: runningSectionHeightPercent + '%' } : {}"
    >
      <div class="flex-1 overflow-auto">
        <RunningAgentsPanel />
      </div>
    </div>

    <!-- Resizer -->
    <div 
       v-if="activeSections.has('running') && activeSections.has('config')"
       class="h-1 bg-gray-100 hover:bg-blue-400 cursor-row-resize z-10 transition-colors border-t border-b border-gray-200 flex-shrink-0"
       @mousedown="initVerticalResize"
       title="Drag to resize"
    ></div>



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
import { reactive, computed, ref, watch } from 'vue'
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

// --- Vertical Resizer Logic ---
const runningSectionHeightPercent = ref(50);
const isResizingVertical = ref(false);

const initVerticalResize = (event: MouseEvent) => {
  event.preventDefault();
  isResizingVertical.value = true;
  
  const startY = event.clientY;
  const startPercent = runningSectionHeightPercent.value;
  const panelHeight = (event.target as HTMLElement).closest('.h-full')?.clientHeight || 500; // Approximate fallback

  const doDrag = (e: MouseEvent) => {
    const deltaY = e.clientY - startY;
    const deltaPercent = (deltaY / panelHeight) * 100;
    const newPercent = Math.min(Math.max(startPercent + deltaPercent, 10), 90); // Min 10%, Max 90%
    runningSectionHeightPercent.value = newPercent;
  }

  const stopDrag = () => {
    isResizingVertical.value = false;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
  }

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
  document.body.style.cursor = 'row-resize';
};

// --- Auto-Collapse Logic ---
// Watch for new run configuration to collapse the running list
watch(
  [() => runConfigStore.config, () => teamRunConfigStore.config],
  ([newAgentConfig, newTeamConfig]) => {
    // Only collapse if we are NOT in selection mode (meaning we are setting up a NEW run)
    // and a config just appeared.
    if (!isSelectionMode.value) {
      if ((newAgentConfig?.agentDefinitionId || newTeamConfig?.teamDefinitionId)) {
        // Auto-collapse 'running', ensure 'config' is open
        if (activeSections.has('running')) {
            activeSections.delete('running');
        }
        if (!activeSections.has('config')) {
            activeSections.add('config');
        }
      }
    }
  },
  { deep: true, immediate: true }
);
</script>
