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
        <div v-else key="workflow-steps" class="flex-1 overflow-auto">
          <WorkflowSteps />
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
      <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]">
        <div class="flex-1 overflow-auto">
          <WorkflowStepView />
        </div>
      </div>

      <div class="drag-handle"></div>

      <!-- Terminal Area -->
      <div :style="{ width: terminalWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <RightSideTabs />
      </div>
    </template>

    <!-- Content Preview -->
    <div v-if="isPreviewMode" 
      class="fixed bottom-4 right-4 w-80 h-40 bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer 
        transition-all duration-300 hover:shadow-xl z-20"
      @click="handleExpandContent"
    >
      <ScaledPreviewContainer :snapshot-url="snapshotService.getSnapshot()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { useWorkflowUIStore } from '~/stores/workflowUI'
import { snapshotService } from '~/services/snapshotService'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowSteps from '~/components/workflow/WorkflowSteps.vue'
import WorkflowStepView from '~/components/workflow/WorkflowStepView.vue'
import RightSideTabs from './RightSideTabs.vue'
import ScaledPreviewContainer from '~/components/common/ScaledPreviewContainer.vue'
import { usePanelResize } from '~/composables/usePanelResize'

const fileExplorerStore = useFileExplorerStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const workflowUIStore = useWorkflowUIStore()

const { fileExplorerWidth, initDragFileToContent } = usePanelResize()
const { isFullscreenMode, isPreviewMode } = storeToRefs(fileContentDisplayModeStore)
const { isWorkflowOpen } = storeToRefs(workflowUIStore)

const terminalWidth = ref(300)

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
</style>
