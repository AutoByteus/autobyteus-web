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
import { useServerSettingsStore } from '~/stores/serverSettings'; // Added import
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'
import MinimizedFileIndicator from '~/components/fileExplorer/MinimizedFileIndicator.vue'

definePageMeta({
  middleware: ['workspace']
})

const fileExplorerStore = useFileExplorerStore()
const serverSettingsStore = useServerSettingsStore(); // Added instance

const showFileContent = computed(() => fileExplorerStore.getOpenFiles.length > 0)

onMounted(() => {
  // Fetch server settings when the workspace page is mounted
  // This ensures settings are available for components like VNCViewer
  console.log('Workspace.vue: Mounted. Fetching server settings...');
  serverSettingsStore.fetchServerSettings().catch(error => {
    console.error('Workspace.vue: Failed to fetch server settings on mount:', error);
    // Handle error appropriately, e.g., show a notification to the user
  });
});
</script>
