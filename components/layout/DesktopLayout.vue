<template>
  <div class="hidden md:flex flex-1 relative space-x-6 min-h-0">
    <!-- File Explorer -->
    <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
      <div class="flex-1 overflow-auto">
        <FileExplorer />
      </div>
    </div>
    
    <!-- File to Content Drag Handle -->
    <div class="w-2 bg-gray-300 cursor-col-resize" @mousedown="initDragFileToContent"></div>
    
    <!-- Content Viewer -->
    <div v-if="showFileContent" :style="{ width: contentViewerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
      <div class="flex-1 overflow-auto">
        <ContentViewer />
      </div>
    </div>
    
    <!-- Content to Workflow Drag Handle -->
    <div v-if="showFileContent" class="w-2 bg-gray-300 cursor-col-resize" @mousedown="(e) => initDragContentToWorkflow(e, showFileContent)"></div>
    
    <!-- Workflow Display -->
    <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0" :style="workflowStyles">
      <div class="flex-1 overflow-auto">
        <WorkflowDisplay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowDisplay from '~/components/workflow/WorkflowDisplay.vue'
import { usePanelResize } from '~/composables/usePanelResize'

const props = defineProps<{
  showFileContent: boolean
}>()

const {
  fileExplorerWidth,
  contentViewerWidth,
  initDragFileToContent,
  initDragContentToWorkflow
} = usePanelResize()

const workflowStyles = computed(() => ({
  flex: '1 1 0%',
  minWidth: '200px', // Reduced from 300px to allow more flexibility
  maxWidth: 'calc(100% - 200px)' // Ensure workflow panel doesn't take up too much space
}))
</script>

<style scoped>
.cursor-col-resize {
  cursor: col-resize;
}

.bg-gray-300 {
  background-color: #d1d5db;
}

.w-2 {
  width: 8px;
}
</style>