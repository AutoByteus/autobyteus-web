<template>
  <div class="file-explorer flex flex-col h-full">
    <h2 class="text-xl font-semibold mb-4 flex-shrink-0">Project Files</h2>
    <div class="file-explorer-content flex-grow overflow-y-auto">
      <div v-if="!hasWorkspaces" class="text-gray-500 italic">
        No workspaces available. Add a workspace to see files.
      </div>
      <div v-else-if="files.length === 0" class="text-gray-500 italic">
        This workspace is empty. Add files to see them here.
      </div>
      <div v-else class="space-y-2">
        <FileItem v-for="file in files" :key="file.path" :file="file" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FileItem from "~/components/fileExplorer/FileItem.vue";
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const files = computed(() => {
  return workspaceStore.activeWorkspaceTree ? workspaceStore.activeWorkspaceTree.children : []
})

const hasWorkspaces = computed(() => workspaceStore.allWorkspaces.length > 0)

onMounted(() => {
  console.log("Active workspace tree:", workspaceStore.activeWorkspaceTree)
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