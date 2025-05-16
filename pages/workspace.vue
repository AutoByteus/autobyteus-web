<template>
  <div class="flex flex-col h-full bg-gray-100 pl-2 font-sans text-gray-800 border-t border-b border-gray-300">
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
    
    <!-- Add the MinimizedFileIndicator component at the page level -->
    <MinimizedFileIndicator />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'
import MinimizedFileIndicator from '~/components/fileExplorer/MinimizedFileIndicator.vue'

definePageMeta({
  middleware: ['workspace']
})

const fileExplorerStore = useFileExplorerStore()
const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0)
</script>
