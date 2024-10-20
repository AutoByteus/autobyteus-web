<template>
  <div class="file-explorer flex flex-col h-full" :style="{ width: explorerWidth + 'px' }">
    <h2 class="text-xl font-semibold mb-4 flex-shrink-0">Project Files</h2>
    <button @click="toggleHide" class="toggle-btn">
      <i v-if="!isHidden" class="fas fa-chevron-left"></i>
      <i v-else class="fas fa-chevron-right"></i>
    </button>
    <div v-if="!isHidden" class="file-explorer-content flex-grow overflow-y-auto h-full">
      <div v-if="!hasWorkspaces" class="text-gray-500 italic">
        No workspaces available. Add a workspace to see files.
      </div>
      <div v-else-if="!files.length" class="text-gray-500 italic">
        This workspace is empty or no workspace is selected. Add files or select a workspace to see them here.
      </div>
      <div v-else class="space-y-2">
        <FileItem v-for="file in files" :key="file.path" :file="file" />
      </div>
    </div>
    <div v-if="!isHidden && !resizing" class="resizer" @mousedown="initResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FileItem from "~/components/fileExplorer/FileItem.vue";
import { useWorkspaceStore } from '~/stores/workspace';

const workspaceStore = useWorkspaceStore();

const files = computed(() => {
  return workspaceStore.currentWorkspaceTree ? workspaceStore.currentWorkspaceTree.children : []
});

const hasWorkspaces = computed(() => workspaceStore.allWorkspaceIds.length > 0);

// States for resizing
const explorerWidth = ref(250);
const isHidden = ref(false);
const resizing = ref(false);

const toggleHide = () => {
  isHidden.value = !isHidden.value;
};

// Mouse events for resizing
const initResize = (event: MouseEvent) => {
  resizing.value = true;
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
};

const resize = (event: MouseEvent) => {
  if (resizing.value) {
    explorerWidth.value = Math.max(event.clientX, 100); // Set a minimum width of 100px
  }
};

const stopResize = () => {
  resizing.value = false;
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);
};

onMounted(() => {
  console.log("Current workspace tree:", workspaceStore.currentWorkspaceTree);
});
</script>

<style scoped>
.file-explorer {
  height: 100%;
  background-color: #f9f9f9;
  border-right: 1px solid #ddd;
  transition: width 0.3s ease;
  position: relative;
}

.toggle-btn {
  position: absolute;
  top: 10px;
  right: -20px;
  background-color: white;
  border-radius: 50%;
  border: 1px solid #ccc;
  padding: 5px;
}

.resizer {
  width: 5px;
  cursor: ew-resize;
  background-color: #ddd;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
}

.file-explorer-content {
  overflow-y: auto;
}
</style>