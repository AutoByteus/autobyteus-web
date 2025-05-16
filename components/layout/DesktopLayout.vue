<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- File Explorer Container -->
    <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-0 shadow flex flex-col min-h-0 relative">
      <div class="flex-1 overflow-auto">
        <FileExplorer />
      </div>

      <!-- Workflow Overlay -->
      <div 
        v-show="isWorkflowOpen"
        class="absolute left-0 top-0 h-full bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-200 min-w-[300px] max-w-[500px]"
        :class="[
          isWorkflowOpen ? 'opacity-100 z-10' : 'opacity-0 -z-10'
        ]"
      >
        <div class="flex-1 overflow-auto p-0">
          <LeftSidebarOverlay />
        </div>
      </div>
    </div>

    <div class="drag-handle" @mousedown="initDragFileToContent"></div>

    <!-- Content Area -->
    <div v-if="isFullscreenMode" 
      class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]"
    >
      <div class="flex-1 overflow-auto relative">
        <ContentViewer />
      </div>
    </div>

    <template v-else>
      <div class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px]">
        <div class="flex-1 overflow-auto">
          <WorkflowStepView />
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
import LeftSidebarOverlay from '~/components/workflow/LeftSidebarOverlay.vue'

const workflowUIStore = useWorkflowUIStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()

const { isFullscreenMode, isMinimizedMode } = storeToRefs(fileContentDisplayModeStore)
const { isWorkflowOpen } = storeToRefs(workflowUIStore)
const { fileExplorerWidth, initDragFileToContent } = usePanelResize()
const { isRightPanelVisible, rightPanelWidth, toggleRightPanel, initDragRightPanel } = useRightPanel()

const handleExpandContent = () => {
  fileContentDisplayModeStore.showFullscreen()
}
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
/* Ensure Workflow Overlay content padding is also p-0 if its container is p-0 */
.absolute.left-0.top-0 .p-0 { /* Targeting the inner div if its parent is p-0 now */
  padding: 0rem !important; /* explicit p-0 for child if needed */
}
</style>
