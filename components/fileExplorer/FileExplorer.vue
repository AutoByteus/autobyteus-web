<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Project Files</h2>
    <div v-if="files.length === 0" class="text-gray-500 italic">
      No files available. Add a workspace to see files.
    </div>
    <div v-else class="space-y-2">
      <FileItem v-for="file in files" :key="file.path" :file="file" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FileItem from "~/components/fileExplorer/FileItem.vue";
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const files = computed(() => {
  return workspaceStore.workspaceTree ? workspaceStore.workspaceTree.children : []
})

onMounted(() => {
  console.log("Workspace tree:", workspaceStore.workspaceTree)
})
</script>