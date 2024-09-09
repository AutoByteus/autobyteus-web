<template>
    <div id="fileExplorer" class="file-explorer">
      <h2>Project Files</h2>
      <div class="files">
        <FileItem v-for="file in files" :key="file.path" :file="file" />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { useWorkspaceStore } from '~/stores/workspace'
  
  const workspaceStore = useWorkspaceStore()
  
  const files = computed(() => {
    return workspaceStore.workspaceTree ? workspaceStore.workspaceTree.children : []
  })
  
  onMounted(() => {
    console.log("Workspace tree:", workspaceStore.workspaceTree)
  })
  </script>
  
  <style scoped>
  /* ... (keep existing styles) ... */
  </style>