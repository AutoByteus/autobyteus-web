<template>
  <div class="flex flex-col h-full bg-gray-100 p-5 sm:p-5 font-sans text-gray-800">
    <!-- Removed the WorkspaceSelector here since it now appears as an overlay in Sidebar -->
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'

const fileExplorerStore = useFileExplorerStore()
const workspaceUIStore = useWorkspaceUIStore()

const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0)

/* 
  Removed any references to isWorkspaceSelectorVisible or <WorkspaceSelector /> 
  since it's now handled in the Sidebar overlay
*/
</script>
