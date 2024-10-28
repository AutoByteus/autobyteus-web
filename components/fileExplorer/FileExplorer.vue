<template>
  <div class="file-explorer flex flex-col h-full">
      <h2 class="text-xl font-semibold mb-4 flex-shrink-0">Project Files</h2>
      <div v-if="activeWorkspace" class="mb-4 px-0.5">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search files..."
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block"
        />
      </div>
      <div class="file-explorer-content flex-grow overflow-y-auto">
        <div v-if="!hasWorkspaces" class="text-gray-500 italic">
          No workspaces available. Add a workspace to see files.
        </div>
        <div v-else-if="searchLoading" class="text-gray-500 italic">
          Loading search results...
        </div>
        <div v-else-if="displayedFiles.length === 0 && searchQuery" class="text-gray-500 italic">
          No files match your search.
        </div>
        <div v-else class="space-y-2">
          <FileItem v-for="file in displayedFiles" :key="file.path" :file="file" />
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import FileItem from "~/components/fileExplorer/FileItem.vue";
import { useWorkspaceStore } from '~/stores/workspace'
import { useFileExplorerStore } from '~/stores/fileExplorer'

const workspaceStore = useWorkspaceStore()
const fileExplorerStore = useFileExplorerStore()

const searchQuery = ref('')
const hasWorkspaces = computed(() => workspaceStore.allWorkspaceIds.length > 0)
const searchLoading = computed(() => fileExplorerStore.isSearchLoading)
const activeWorkspace = computed(() => workspaceStore.activeWorkspace)

const displayedFiles = computed(() => {
  if (searchQuery.value) {
    return fileExplorerStore.getSearchResults
  } else {
    return workspaceStore.currentWorkspaceTree?.children || []
  }
})

watch(searchQuery, () => {
  fileExplorerStore.searchFiles(searchQuery.value)
})

watch(activeWorkspace, (newWorkspace) => {
  if (!newWorkspace) {
    searchQuery.value = '' // Clear search when workspace is deselected
  }
})

onMounted(() => {
  if (searchQuery.value && activeWorkspace.value) {
    fileExplorerStore.searchFiles(searchQuery.value)
  }
})
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