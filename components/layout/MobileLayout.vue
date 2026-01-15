<template>
  <div class="md:hidden flex flex-1 flex-col min-h-0">
    <!-- Mobile Navigation -->
    <div class="flex bg-white shadow p-2 gap-2 overflow-x-auto">
      <button 
        v-for="(tab, index) in availableTabs"
        :key="index"
        @click="handleTabClick(tab.id)"
        :class="[
          'flex-shrink-0 py-2 px-4 rounded-md transition-colors whitespace-nowrap',
          activeMobilePanel === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Mobile Panels -->
    <div class="flex-1 bg-white shadow overflow-hidden relative mt-2"> 
      <!-- File Explorer -->
      <div v-if="hasActiveWorkspace" v-show="activeMobilePanel === 'explorer'" class="h-full p-0 overflow-auto">
        <FileExplorer />
      </div>

      <!-- Content Viewer -->
      <div v-show="activeMobilePanel === 'content'" class="h-full p-0 overflow-auto">
        <FileExplorerTabs :expandedMode="true" />
      </div>

      <!-- Running Panel -->
      <div v-show="activeMobilePanel === 'running'" class="h-full p-0 overflow-auto flex flex-col">
        <div class="flex-1 overflow-auto">
          <RunningAgentsPanel />
        </div>
        <div class="flex-1 overflow-auto border-t border-gray-200">
          <RunConfigPanel />
        </div>
      </div>

      <!-- Main Interaction View (Agent or Team) -->
      <div v-show="activeMobilePanel === 'main'" class="h-full p-0 overflow-auto">
        <AgentWorkspaceView v-if="selectionStore.selectedType === 'agent'" />
        <TeamWorkspaceView v-else-if="selectionStore.selectedType === 'team'" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <p>Select or run an agent/team to begin.</p>
        </div>
      </div>

      <!-- Right Side Tools (Terminal, VNC etc) -->
      <div v-show="activeMobilePanel === 'tools'" class="h-full p-0 overflow-auto">
        <RightSideTabs />
      </div>
    </div>

    <!-- Floating action buttons -->
    <div class="fixed bottom-4 right-4 flex flex-col gap-2">
      <!-- Content editor button -->
      <button
        v-if="showFileContent && activeMobilePanel !== 'content'"
        @click="activeMobilePanel = 'content'"
        class="px-4 py-2 bg-blue-500 text-white rounded shadow-lg z-20 text-sm"
      >
        Open Editor
      </button>

      <!-- Agent profile button -->
      <button
        v-if="activeMobilePanel === 'main' && !selectionStore.selectedInstanceId"
        @click="activeMobilePanel = 'running'"
        class="px-4 py-2 bg-blue-500 text-white rounded shadow-lg z-20 text-sm"
      >
        Open Running
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue';
import FileExplorerTabs from '~/components/fileExplorer/FileExplorerTabs.vue';
import RunningAgentsPanel from '~/components/workspace/running/RunningAgentsPanel.vue';
import RunConfigPanel from '~/components/workspace/config/RunConfigPanel.vue';
import AgentWorkspaceView from '~/components/workspace/agent/AgentWorkspaceView.vue';
import TeamWorkspaceView from '~/components/workspace/team/TeamWorkspaceView.vue'; // Import Team View
import RightSideTabs from './RightSideTabs.vue';
import { useMobilePanels } from '~/composables/useMobilePanels';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{  
  showFileContent: boolean
}>();

const selectionStore = useAgentSelectionStore();
const workspaceStore = useWorkspaceStore();
const { activeMobilePanel } = useMobilePanels();

const hasActiveWorkspace = computed(() => !!workspaceStore.activeWorkspace);

const availableTabs = computed(() => {
  const mainTabLabel = selectionStore.selectedType === 'team' ? 'Team' : 'Agent';

  const tabs = [
    ...(hasActiveWorkspace.value ? [{ id: 'explorer', label: 'Files' }] : []),
    { id: 'running', label: 'Running' },
    { id: 'main', label: mainTabLabel },
    { id: 'tools', label: 'Tools' }
  ];
  
  if (props.showFileContent && hasActiveWorkspace.value) {
    const explorerIndex = tabs.findIndex(t => t.id === 'explorer');
    if (explorerIndex !== -1) {
      tabs.splice(explorerIndex + 1, 0, { id: 'content', label: 'Content' });
    }
  }
  
  return tabs;
});

const handleTabClick = (tabId: string) => {
  if (tabId === 'main' && !selectionStore.selectedInstanceId) {
    activeMobilePanel.value = 'running';
  } else {
    activeMobilePanel.value = tabId;
  }
}
</script>

<style scoped>
.h-full {
  transition: all 0.3s ease-in-out;
}

.fixed {
  position: fixed;
}

.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
