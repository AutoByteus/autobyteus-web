<template>
  <div class="flex flex-col h-full bg-gray-100 p-5 sm:p-5 font-sans text-gray-800">
    <WorkspaceSelector class="bg-gray-200 p-4 rounded-lg mb-6 flex-shrink-0" />
    
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'

const fileExplorerStore = useFileExplorerStore()
const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0)
</script>