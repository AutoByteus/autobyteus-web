<template>
  <div class="flex flex-col h-full bg-gray-100 p-5 sm:p-5 font-sans text-gray-800">
    <WorkspaceSelector class="bg-gray-200 p-4 rounded-lg mb-6 flex-shrink-0" />

    <div class="flex flex-1 relative space-x-6 min-h-0">
      <!-- File Explorer: Adjustable Width -->
      <div :style="{ width: fileExplorerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <div class="flex-1 overflow-auto">
          <FileExplorer />
        </div>
      </div>
      
      <!-- Drag Handle between File Explorer and Content Viewer -->
      <div class="w-2 bg-gray-300 cursor-col-resize" @mousedown="initDragFileToContent"></div>
      
      <!-- Content Viewer: Adjustable Width -->
      <div v-if="showFileContent" :style="{ width: contentViewerWidth + 'px' }" class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <div class="flex-1 overflow-auto">
          <ContentViewer />
        </div>
      </div>
      
      <!-- Drag Handle between Content Viewer and Workflow Display -->
      <div v-if="showFileContent" class="w-2 bg-gray-300 cursor-col-resize" @mousedown="initDragContentToWorkflow"></div>
      
      <!-- Workflow Display: Flexible Width -->
      <div class="bg-white p-4 rounded-lg shadow flex flex-col min-h-0" :style="{
        flex: showFileContent ? '1 1 0%' : '4 0 0%',
        minWidth: '300px',
        maxWidth: showFileContent ? 'calc(100% - ' + (fileExplorerWidth + contentViewerWidth + 32) + 'px)' : 'calc(100% - ' + (fileExplorerWidth + 16) + 'px)'
      }">
        <div class="flex-1 overflow-auto">
          <WorkflowDisplay />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { useFileExplorerStore } from "~/stores/fileExplorer";
import WorkspaceSelector from "~/components/workspace/WorkspaceSelector.vue";
import FileExplorer from "~/components/fileExplorer/FileExplorer.vue";
import ContentViewer from "~/components/fileExplorer/FileContentViewer.vue";
import WorkflowDisplay from "~/components/workflow/WorkflowDisplay.vue";

const fileExplorerStore = useFileExplorerStore();

const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0);

// Refs for widths
const fileExplorerWidth = ref(200); // Initial width in px
const contentViewerWidth = ref(300); // Initial width in px

// Dragging state for File to Content
const isDraggingFileToContent = ref(false);
const startXFileToContent = ref(0);
const startFileExplorerWidth = ref(200);
const startContentViewerWidth = ref(300);

// Dragging state for Content to Workflow
const isDraggingContentToWorkflow = ref(false);
const startXContentToWorkflow = ref(0);
const startContentViewerWidthWorkflow = ref(300);

// Methods for File to Content drag
const initDragFileToContent = (e: MouseEvent) => {
  isDraggingFileToContent.value = true;
  startXFileToContent.value = e.clientX;
  startFileExplorerWidth.value = fileExplorerWidth.value;
  startContentViewerWidth.value = contentViewerWidth.value;
  window.addEventListener("mousemove", onDragFileToContent);
  window.addEventListener("mouseup", stopDragFileToContent);
};

const onDragFileToContent = (e: MouseEvent) => {
  if (!isDraggingFileToContent.value) return;
  const dx = e.clientX - startXFileToContent.value;
  // Update widths with constraints
  const newFileExplorerWidth = startFileExplorerWidth.value + dx;
  const newContentViewerWidth = startContentViewerWidth.value - dx;
  
  // Calculate maximum allowed width based on window size
  const maxContentViewerWidth = window.innerWidth * 0.75;
  const minFileExplorerWidth = 150;
  const maxFileExplorerWidth = window.innerWidth - maxContentViewerWidth - 100; // 100px reserved for other elements
  const minContentViewerWidth = 100; // Increased from 50 to ensure drag handle remains visible
  
  // Set minimum and maximum widths
  if (newFileExplorerWidth > minFileExplorerWidth && newFileExplorerWidth < maxFileExplorerWidth) {
    fileExplorerWidth.value = newFileExplorerWidth;
  }
  if (newContentViewerWidth > minContentViewerWidth && newContentViewerWidth < maxContentViewerWidth) {
    contentViewerWidth.value = newContentViewerWidth;
  }
};

const stopDragFileToContent = () => {
  isDraggingFileToContent.value = false;
  window.removeEventListener("mousemove", onDragFileToContent);
  window.removeEventListener("mouseup", stopDragFileToContent);
};

// Methods for Content to Workflow drag
const initDragContentToWorkflow = (e: MouseEvent) => {
  if (!showFileContent.value) return;
  isDraggingContentToWorkflow.value = true;
  startXContentToWorkflow.value = e.clientX;
  startContentViewerWidthWorkflow.value = contentViewerWidth.value;
  window.addEventListener("mousemove", onDragContentToWorkflow);
  window.addEventListener("mouseup", stopDragContentToWorkflow);
};

const onDragContentToWorkflow = (e: MouseEvent) => {
  if (!isDraggingContentToWorkflow.value) return;
  const dx = e.clientX - startXContentToWorkflow.value;
  // Update Content Viewer width with constraints
  const newContentViewerWidth = startContentViewerWidthWorkflow.value + dx;
  
  // Calculate maximum allowed width based on window size
  const maxContentViewerWidth = window.innerWidth * 0.75;
  const minContentViewerWidth = 100; // Increased from 50 to ensure drag handle remains visible
  
  if (newContentViewerWidth > minContentViewerWidth && newContentViewerWidth < maxContentViewerWidth) {
    contentViewerWidth.value = newContentViewerWidth;
  }
};

const stopDragContentToWorkflow = () => {
  isDraggingContentToWorkflow.value = false;
  window.removeEventListener("mousemove", onDragContentToWorkflow);
  window.removeEventListener("mouseup", stopDragContentToWorkflow);
};

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onDragFileToContent);
  window.removeEventListener("mouseup", stopDragFileToContent);
  window.removeEventListener("mousemove", onDragContentToWorkflow);
  window.removeEventListener("mouseup", stopDragContentToWorkflow);
});
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