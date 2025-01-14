<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- File Explorer -->
    <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
      <div class="flex-1 overflow-auto">
        <FileExplorer />
      </div>
    </div>
    
    <div class="drag-handle" @mousedown="initDragFileToContent"></div>

    <!-- Main Content Area -->
    <div v-if="isFullscreenMode" 
      class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]"
    >
      <div class="flex-1 overflow-auto relative" ref="contentContainerRef">
        <ContentViewer 
          :expanded-mode="true"
          @minimize="handleMinimizeContent"
          @snapshot="handleContentSnapshot" 
        />
      </div>
    </div>

    <template v-else>
      <!-- Workflow Area -->
      <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0 flex-1 min-w-[200px] max-w-[calc(100%-200px)]">
        <div class="flex-1 overflow-auto">
          <WorkflowDisplay />
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
      <ScaledPreviewContainer ref="previewContainerRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowDisplay from '~/components/workflow/WorkflowDisplay.vue'
import RightSideTabs from './RightSideTabs.vue'
import ScaledPreviewContainer from '~/components/common/ScaledPreviewContainer.vue'
import { usePanelResize } from '~/composables/usePanelResize'

const fileExplorerStore = useFileExplorerStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { fileExplorerWidth, initDragFileToContent } = usePanelResize()

// Use storeToRefs for reactive store properties
const { isFullscreenMode, isPreviewMode } = storeToRefs(fileContentDisplayModeStore)

const terminalWidth = ref(300)
const contentContainerRef = ref<HTMLElement | null>(null)
const previewContainerRef = ref()

const handleContentSnapshot = async (element: HTMLElement) => {
  await nextTick()
  previewContainerRef.value?.captureSnapshot(element)
}

const handleMinimizeContent = () => {
  fileContentDisplayModeStore.showPreview()
}

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
</style>
