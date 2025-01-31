<template>
  <div 
    class="file-explorer flex flex-col h-full pt-4"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
      <div v-if="activeWorkspace" class="mb-4 px-0.5">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search files..."
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block"
        />
      </div>
      <div 
        class="file-explorer-content flex-grow overflow-y-auto relative"
        :class="{ 'drop-target': isDropTarget }"
      >
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

        <!-- Root drop indicator -->
        <div 
          v-if="isDropTarget" 
          class="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
          :class="{ 'opacity-50': true }"
        ></div>
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
const isDropTarget = ref(false)
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

const isValidDragData = (event: DragEvent): boolean => {
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return false
    
    const dragData = JSON.parse(data)
    if (!dragData.path) return false
    
    // Allow drops on root if not trying to drop on itself or its parent
    const sourcePath = dragData.path
    const sourceParentPath = sourcePath.split('/').slice(0, -1).join('/')
    
    return sourceParentPath !== '' // Prevent dropping root onto itself
  } catch {
    return false
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // Only show drop indicator if hovering over the explorer content area
  const target = event.target as HTMLElement
  if (!target.closest('.file-explorer-content')) return

  if (!isValidDragData(event)) return

  isDropTarget.value = true
  event.dataTransfer!.dropEffect = 'move'
}

const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  
  // Only hide drop indicator if leaving the explorer content area
  const relatedTarget = event.relatedTarget as HTMLElement
  if (!relatedTarget?.closest('.file-explorer-content')) {
    isDropTarget.value = false
  }
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDropTarget.value = false

  // Only handle drops directly on the explorer content area
  const target = event.target as HTMLElement
  if (!target.closest('.file-explorer-content')) return
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return
    
    const { path: sourcePath } = JSON.parse(data)
    if (!sourcePath) return

    // When dropping on root, the destination is just the file/folder name
    const sourceBasename = sourcePath.split('/').pop() || ''
    const destinationPath = sourceBasename

    await fileExplorerStore.moveFileOrFolder(sourcePath, destinationPath)
  } catch (error) {
    console.error('Failed to move item to root:', error)
  }
}

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

.drop-target {
  position: relative;
}

.drop-target::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed #3b82f6;
  border-radius: 0.5rem;
  pointer-events: none;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
</style>
