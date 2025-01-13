<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- File Explorer on the left side -->
    <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
      <div class="flex-1 overflow-auto">
        <FileExplorer />
      </div>
    </div>
    
    <!-- File to Content Drag Handle -->
    <div class="drag-handle" @mousedown="initDragFileToContent"></div>

    <!-- 1) If the viewer is expanded, show it in place of Workflow + RightSideTabs -->
    <div 
      v-if="showFileContent && isViewerExpanded" 
      class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0"
      style="flex: 1 1 0%; min-width: 200px; max-width: calc(100% - 200px)"
    >
      <div class="flex-1 overflow-auto relative">
        <ContentViewer 
          :expandedMode="true" 
          @minimize="handleMinimizeViewer" 
        />
      </div>
    </div>

    <!-- 2) If the viewer is NOT expanded, show Workflow + RightSideTabs as usual -->
    <template v-else>
      <!-- Content to Workflow Drag Handle -->
      <div 
        v-if="showFileContent" 
        class="drag-handle" 
        @mousedown="(e) => initDragContentToWorkflow(e, showFileContent)"
      ></div>

      <!-- Workflow Display (center) -->
      <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0" :style="workflowStyles">
        <div class="flex-1 overflow-auto">
          <WorkflowDisplay />
        </div>
      </div>

      <!-- Drag Handle between Workflow and RightSideTabs -->
      <div class="drag-handle" @mousedown="initDragWorkflowToTerminal"></div>

      <!-- Right side tab container for Terminal -->
      <div :style="{ width: terminalWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <RightSideTabs />
      </div>
    </template>

    <!-- 
      3) Show the "minimized" floating viewer if file content is open but NOT expanded 
         and now with proportional scaling via ScaledPreviewContainer.
    -->
    <div 
      v-if="showFileContent && !isViewerExpanded" 
      class="fixed bottom-4 right-4 w-80 h-40 bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-xl z-20"
      @click="handleExpandViewer"
    >
      <!-- Proportional scaling container for the preview -->
      <ScaledPreviewContainer>
        <ContentViewer :expandedMode="false" />
      </ScaledPreviewContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowDisplay from '~/components/workflow/WorkflowDisplay.vue'
import RightSideTabs from './RightSideTabs.vue'
import ScaledPreviewContainer from '~/components/common/ScaledPreviewContainer.vue'
import { usePanelResize } from '~/composables/usePanelResize'
import { useFileExplorerStore } from '~/stores/fileExplorer'

const props = defineProps<{  showFileContent: boolean
}>()

// Panel resizing composable
const {
  fileExplorerWidth,
  contentViewerWidth,
  initDragFileToContent,
  initDragContentToWorkflow
} = usePanelResize()

// Terminal width + optional resizing
const terminalWidth = ref(300)
const initDragWorkflowToTerminal = (e: MouseEvent) => {
  // Implement optional resizing logic for Terminal panel here if desired.
}

// Workflow display styling
const workflowStyles = computed(() => ({
  flex: '1 1 0%',
  minWidth: '200px',
  maxWidth: 'calc(100% - 200px)'
}))

// Track whether the FileContentViewer is expanded or minimized
const isViewerExpanded = ref(false)

// Expand the viewer to occupy the full right side
const handleExpandViewer = () => {
  isViewerExpanded.value = true
}

// Minimize the viewer back to small preview
const handleMinimizeViewer = () => {
  isViewerExpanded.value = false
}

</script>

<style scoped>
.drag-handle {
  width: 4px;
  background-color: #d1d5db;
  cursor: col-resize;
  transition: background-color 0.2s ease;
  margin: 0;
}

.drag-handle:hover {
  background-color: #9ca3af;
}

.drag-handle:active {
  background-color: #6b7280;
}

/* Additional styles for the floating preview */
.fixed {
  position: fixed;
}
</style>
