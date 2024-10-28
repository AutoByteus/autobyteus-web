<template>
  <div class="file-explorer flex flex-col h-full">
    <h2 class="text-xl font-semibold mb-4 flex-shrink-0">Project Files</h2>
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search files..."
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div class="file-explorer-content flex-grow overflow-y-auto">
      <div v-if="!hasWorkspaces" class="text-gray-500 italic">
        No workspaces available. Add a workspace to see files.
      </div>
      <div v-else-if="filteredFiles.length === 0 && searchQuery" class="text-gray-500 italic">
        No files match your search.
      </div>
      <div v-else class="space-y-2">
        <FileItem v-for="file in filteredFiles" :key="file.path" :file="file" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import FileItem from "~/components/fileExplorer/FileItem.vue";
import { useWorkspaceStore } from '~/stores/workspace'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import Fuse from 'fuse.js'

const workspaceStore = useWorkspaceStore()
const fileExplorerStore = useFileExplorerStore()

const searchQuery = ref('')
const filteredFiles = ref<any[]>([])

const hasWorkspaces = computed(() => workspaceStore.allWorkspaceIds.length > 0)

const initializeFuse = () => {
  const flattenedFiles = getAllFiles(workspaceStore.currentWorkspaceTree?.children || [])
  fileExplorerStore.initializeFuse(flattenedFiles)
}

const getAllFiles = (nodes: any[], result: Array<{ name: string; path: string }> = []): Array<{ name: string; path: string }> => {
  nodes.forEach(node => {
    if (node.is_file) {
      result.push({ name: node.name, path: node.path })
    } else if (node.children && node.children.length > 0) {
      getAllFiles(node.children, result)
    }
  })
  return result
}

const performSearch = () => {
  if (!fileExplorerStore.fuse || !searchQuery.value) {
    filteredFiles.value = workspaceStore.currentWorkspaceTree?.children || []
    return
  }

  const results = fileExplorerStore.fuse.search(searchQuery.value)
  const matchedPaths = results.map(result => result.item.path)

  // Convert matched paths back to tree structure
  const matchedFiles = matchedPaths.map(path => {
    return findFileByPath(workspaceStore.currentWorkspaceTree?.children || [], path)
  }).filter(file => file !== null) as any[]

  filteredFiles.value = matchedFiles
}

const findFileByPath = (nodes: any[], path: string): any | null => {
  for (const node of nodes) {
    if (node.is_file && node.path === path) {
      return node
    }
    if (!node.is_file && node.children) {
      const found = findFileByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}

onMounted(() => {
  initializeFuse()
  performSearch()
})

watch(
  () => workspaceStore.currentWorkspaceTree,
  () => {
    initializeFuse()
    performSearch()
  },
  { deep: true }
)

watch(searchQuery, () => {
  performSearch()
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