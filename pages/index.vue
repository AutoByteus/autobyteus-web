<template>
  <div class="flex flex-col h-screen bg-gray-100 p-2 sm:p-5 font-sans text-gray-800">
    <WorkspaceSelector class="bg-gray-200 p-2 sm:p-4 rounded-lg mb-4" />

    <div class="flex-grow flex h-full relative">
      <!-- File Explorer: Adjustable Width -->
      <div
        :style="{ width: fileExplorerWidth + 'px' }"
        class="bg-white p-4 rounded-lg shadow flex-shrink-0 flex flex-col"
      >
        <FileExplorer />
      </div>

      <!-- Drag Handle between File Explorer and Content Viewer -->
      <div
        class="w-2 bg-gray-300 cursor-col-resize"
        @mousedown="initDragFileToContent"
      ></div>

      <!-- Content Viewer: Adjustable Width -->
      <div
        v-if="showFileContent"
        :style="{ width: contentViewerWidth + 'px' }"
        class="bg-white p-4 rounded-lg shadow flex-shrink-0 flex flex-col"
      >
        <ContentViewer />
      </div>

      <!-- Drag Handle between Content Viewer and Workflow Layout -->
      <div
        v-if="showFileContent"
        class="w-2 bg-gray-300 cursor-col-resize"
        @mousedown="initDragContentToWorkflow"
      ></div>

      <!-- Workflow Layout: Flexible Width -->
      <div
        :style="workflowLayoutStyle"
        class="bg-white p-4 rounded-lg shadow flex-grow"
      >
        <WorkflowLayout />
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
import WorkflowLayout from "~/components/workflow/WorkflowLayout.vue";

const fileExplorerStore = useFileExplorerStore();

const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0);

// Refs for widths
const fileExplorerWidth = ref(200); // Initial width in px
const contentViewerWidth = ref(300); // Increased initial width in px

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

  // Set minimum and maximum widths
  if (newFileExplorerWidth > minFileExplorerWidth && newFileExplorerWidth < maxFileExplorerWidth) {
    fileExplorerWidth.value = newFileExplorerWidth;
  }
  if (newContentViewerWidth > 50 && newContentViewerWidth < maxContentViewerWidth) {
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
  const minContentViewerWidth = 50;

  if (newContentViewerWidth > minContentViewerWidth && newContentViewerWidth < maxContentViewerWidth) {
    contentViewerWidth.value = newContentViewerWidth;
  }
};

const stopDragContentToWorkflow = () => {
  isDraggingContentToWorkflow.value = false;
  window.removeEventListener("mousemove", onDragContentToWorkflow);
  window.removeEventListener("mouseup", stopDragContentToWorkflow);
};

// Computed style for Workflow Layout
const workflowLayoutStyle = computed(() => {
  if (showFileContent.value) {
    return {
      flex: "1 1 0%",
      width: "auto",
    };
  } else {
    return {
      flex: "4 0 0%",
      width: "auto",
    };
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onDragFileToContent);
  window.removeEventListener("mouseup", stopDragFileToContent);
  window.removeEventListener("mousemove", onDragContentToWorkflow);
  window.removeEventListener("mouseup", stopDragContentToWorkflow);
});
</script>

<style scoped>
/* Ensure the drag handles span the full height */
.cursor-col-resize {
  cursor: col-resize;
}

/* Optional: Improve the appearance of drag handles */
.bg-gray-300 {
  background-color: #d1d5db;
}

.w-2 {
  width: 8px;
}
</style>