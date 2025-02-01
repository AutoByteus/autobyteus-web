<template>
  <div class="file-explorer flex flex-col h-full pt-4">
    <div v-if="activeWorkspace" class="mb-4 px-0.5">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search files..."
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block"
      />
    </div>
    <div class="file-explorer-content flex-grow overflow-y-auto relative">
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
import FileItem from "~/components/fileExplorer/FileItem.vue"
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
    searchQuery.value = ''
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
}

.file-explorer-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 155, 155, 0.7) transparent;
}

.file-explorer-content::-webkit-scrollbar {
  width: 8px;
}

.file-explorer-content::-webkit-scrollbar-track {
  background: transparent;
}

.file-explorer-content::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.7);
  border-radius: 4px;
  border: 2px solid transparent;
}

.file-explorer-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.8);
}
</style>
