<template>
  <div class="flex flex-col h-full bg-gray-100 pl-2 font-sans text-gray-800 border-t border-b border-gray-300">
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
    
    <!-- Add the MinimizedFileIndicator component at the page level -->
    <MinimizedFileIndicator />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useServerSettingsStore } from '~/stores/serverSettings';
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'
import MinimizedFileIndicator from '~/components/fileExplorer/MinimizedFileIndicator.vue'

// This middleware is no longer needed as the home page handles workspace selection.
// definePageMeta({
//   middleware: ['workspace']
// })

const fileExplorerStore = useFileExplorerStore()
const serverSettingsStore = useServerSettingsStore();

const showFileContent = computed(() => fileExplorerStore.getOpenFiles.length > 0)

onMounted(() => {
  console.log('Workspace.vue: Mounted. Fetching server settings...');
  serverSettingsStore.fetchServerSettings().catch(error => {
    console.error('Workspace.vue: Failed to fetch server settings on mount:', error);
  });
});
</script>
