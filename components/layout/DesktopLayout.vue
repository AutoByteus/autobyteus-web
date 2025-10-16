<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- Launch Profile Panel -->
    <div 
      v-show="isProfilePanelOpen"
      :style="{ width: profilePanelWidth + 'px' }"
      class="bg-white border-r border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-300"
    >
      <div class="flex-1 overflow-auto p-0">
        <LaunchProfilePanel />
      </div>
    </div>

    <!-- File Explorer Container - Conditionally rendered -->
    <template v-if="activeLaunchProfileHasWorkspace">
      <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-0 shadow flex flex-col min-h-0 relative">
        <div class="flex-1 overflow-auto">
          <FileExplorer />
        </div>
      </div>

      <div class="drag-handle" @mousedown="initDragFileToContent"></div>
    </template>

    <!-- Content Area -->
    <div v-if="isFullscreenMode" 
      class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]"
    >
      <div class="flex-1 overflow-auto relative">
        <FileContentViewer />
      </div>
    </div>

    <template v-else>
      <div class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px]">
        <div class="flex-1 overflow-auto">
          <!-- UPDATED: Conditional rendering based on selected profile type -->
          <AgentWorkspaceView v-if="selectedLaunchProfileStore.selectedProfileType === 'agent'" />
          <TeamWorkspaceView v-else-if="selectedLaunchProfileStore.selectedProfileType === 'team'" />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            <p>Select a profile to begin.</p>
          </div>
        </div>
      </div>

      <div class="drag-handle" @mousedown="initDragRightPanel"></div>

      <!-- Right Panel -->
      <div 
        v-show="isRightPanelVisible"
        :style="{ width: rightPanelWidth + 'px' }" 
        class="bg-white p-0 shadow flex flex-col min-h-0 relative"
      >
        <RightSideTabs />
        
        <!-- Right Panel Toggle Button (Inside) -->
        <button 
          @click="toggleRightPanel"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-md hover:shadow-lg transition-all duration-200"
          :title="isRightPanelVisible ? 'Hide Side Panel' : 'Show Side Panel'"
        >
          <svg 
            class="w-3 h-3 transition-transform duration-200" 
            :class="{ 'rotate-180': !isRightPanelVisible }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Collapsed Right Panel Button -->
      <button 
        v-if="!isRightPanelVisible"
        @click="toggleRightPanel"
        class="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-md hover:shadow-lg transition-all duration-200"
        title="Show Side Panel"
      >
        <svg 
          class="w-3 h-3 transition-transform duration-200 rotate-180" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { useLaunchProfilePanelOverlayStore } from '~/stores/launchProfilePanelOverlayStore'
import { useWorkspaceStore } from '~/stores/workspace';
import { useRightPanel } from '~/composables/useRightPanel'
import { usePanelResize } from '~/composables/usePanelResize'
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import FileContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import AgentWorkspaceView from '~/components/workspace/agent/AgentWorkspaceView.vue'
import TeamWorkspaceView from '~/components/workspace/team/TeamWorkspaceView.vue' // Import Team View
import RightSideTabs from './RightSideTabs.vue'
import LaunchProfilePanel from '~/components/launchProfiles/LaunchProfilePanel.vue'

const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const launchProfilePanelOverlayStore = useLaunchProfilePanelOverlayStore()
const workspaceStore = useWorkspaceStore();
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

// Launch Profile Panel State
const { isOpen: isProfilePanelOpen } = storeToRefs(launchProfilePanelOverlayStore)
const profilePanelWidth = ref(300)

const { isFullscreenMode } = storeToRefs(fileContentDisplayModeStore)
const { fileExplorerWidth, initDragFileToContent } = usePanelResize()
const { isRightPanelVisible, rightPanelWidth, toggleRightPanel, initDragRightPanel } = useRightPanel()

const activeLaunchProfileHasWorkspace = computed(() => !!workspaceStore.activeWorkspace);
</script>

<style scoped>
.drag-handle {
  width: 4px;
  background-color: #d1d5db;
  cursor: col-resize;
  transition: background-color 0.2s ease;
}

.drag-handle:hover {
  background-color: #9ca3af;
}

.drag-handle:active {
  background-color: #6b7280;
}

.transition-all {
  transition-property: all;
}
</style>
