<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- Launch Profile Panel -->
    <transition name="panel-minimize">
      <div 
        v-if="isProfilePanelOpen"
        :style="{ width: profilePanelWidth + 'px' }"
        class="bg-white border-r border-gray-200 shadow-xl flex flex-col overflow-hidden"
      >
        <div class="flex-1 overflow-auto p-0">
          <LaunchProfilePanel />
        </div>
      </div>
    </transition>

    <!-- File Explorer Container -->
    <template v-if="activeLaunchProfileHasWorkspace">
      <!-- Open State -->
      <transition name="panel-minimize">
        <div 
          v-if="isFileExplorerOpen"
          :style="{ width: fileExplorerWidth + 'px' }" 
          class="bg-white p-0 shadow flex flex-col min-h-0 relative border-r border-gray-200"
        >
          <div class="flex-1 overflow-auto min-w-0">
            <FileExplorer />
          </div>
        </div>
      </transition>

      <!-- Drag Handle -->
      <div v-if="isFileExplorerOpen" class="drag-handle" @mousedown="initDragFileToContent"></div>
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
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore'
import { useWorkspaceStore } from '~/stores/workspace';
import { useRightPanel } from '~/composables/useRightPanel'
import { usePanelResize } from '~/composables/usePanelResize'
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import FileContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import AgentWorkspaceView from '~/components/workspace/agent/AgentWorkspaceView.vue'
import TeamWorkspaceView from '~/components/workspace/team/TeamWorkspaceView.vue'
import RightSideTabs from './RightSideTabs.vue'
import LaunchProfilePanel from '~/components/launchProfiles/LaunchProfilePanel.vue'

const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const workspaceLeftPanelLayoutStore = useWorkspaceLeftPanelLayoutStore()
const { panels } = storeToRefs(workspaceLeftPanelLayoutStore)
const workspaceStore = useWorkspaceStore();
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

// Panel State from new central store
const isProfilePanelOpen = computed(() => panels.value.launchProfile.isOpen)
const isFileExplorerOpen = computed(() => panels.value.fileExplorer.isOpen)
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

/* Minimize Panel Animation */
.panel-minimize-enter-active,
.panel-minimize-leave-active {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms;
  overflow: hidden;
}

.panel-minimize-enter-from,
.panel-minimize-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
