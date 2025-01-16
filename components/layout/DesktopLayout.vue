<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- File Explorer / Workflow Steps Container -->
    <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
      <transition
        mode="out-in"
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="!isWorkflowOpen" key="file-explorer" class="flex-1 overflow-auto">
          <FileExplorer />
        </div>
        <div v-else key="workspace-workflow-selector" class="flex-1 overflow-auto">
          <WorkspaceWorkflowSelector />
        </div>
      </transition>
    </div>

    <div class="drag-handle" @mousedown="initDragFileToContent"></div>

    <!-- Main Content Area -->
    <div v-if="isFullscreenMode" 
      class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]"
    >
      <div class="flex-1 overflow-auto relative">
        <ContentViewer />
      </div>
    </div>

    <template v-else>
      <!-- Workflow Step View Area -->
      <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 flex-1 min-w-[200px]">
        <div class="flex-1 overflow-auto">
          <WorkflowStepView />
        </div>
      </div>

      <div class="drag-handle" @mousedown="initDragRightPanel"></div>

      <!-- Right Side Panel Area with Toggle -->
      <div 
        v-show="isRightPanelVisible"
        :style="{ width: rightPanelWidth + 'px' }" 
        class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 relative"
      >
        <RightSideTabs />
        
        <!-- Right Panel Toggle Button -->
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { useWorkflowUIStore } from '~/stores/workflowUI'
import { useRightPanel } from '~/composables/useRightPanel'
import { usePanelResize } from '~/composables/usePanelResize'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowStepView from '~/components/workflow/WorkflowStepView.vue'
import RightSideTabs from './RightSideTabs.vue'
import WorkspaceWorkflowSelector from '~/components/workflow/LeftSidebarOverlay.vue'

const workflowUIStore = useWorkflowUIStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()

const { isFullscreenMode } = storeToRefs(fileContentDisplayModeStore)
const { isWorkflowOpen } = storeToRefs(workflowUIStore)
const { fileExplorerWidth, initDragFileToContent } = usePanelResize()
const { isRightPanelVisible, rightPanelWidth, toggleRightPanel, initDragRightPanel } = useRightPanel()
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
