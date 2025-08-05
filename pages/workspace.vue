<template>
  <div class="flex flex-col h-full bg-gray-100 pl-2 font-sans text-gray-800 border-t border-b border-gray-300">
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
    
    <MinimizedFileIndicator />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useServerSettingsStore } from '~/stores/serverSettings';
import { useWorkspaceStore } from '~/stores/workspace';
import { LAUNCH_PROFILE_STORAGE_KEY, useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import DesktopLayout from '~/components/layout/DesktopLayout.vue';
import MobileLayout from '~/components/layout/MobileLayout.vue';
import MinimizedFileIndicator from '~/components/fileExplorer/MinimizedFileIndicator.vue';

const fileExplorerStore = useFileExplorerStore();
const serverSettingsStore = useServerSettingsStore();
const workspaceStore = useWorkspaceStore();
const agentLaunchProfileStore = useAgentLaunchProfileStore();
const teamLaunchProfileStore = useAgentTeamLaunchProfileStore();

// RESTORED: This is the original, correct implementation for this computed property.
const showFileContent = computed(() => fileExplorerStore.getOpenFiles.length > 0);

onMounted(() => {
  console.log('Workspace.vue: Mounted. Fetching server settings and loading profiles...');
  
  serverSettingsStore.fetchServerSettings().catch(error => {
    console.error('Workspace.vue: Failed to fetch server settings on mount:', error);
  });
  
  // Load agent profiles and partition them
  try {
    const storedAgentProfiles = localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
    const allAgentProfiles = storedAgentProfiles ? JSON.parse(storedAgentProfiles) : {};
    agentLaunchProfileStore.partitionLaunchProfiles(allAgentProfiles, workspaceStore.allWorkspaceIds);
  } catch (e) {
    console.error("Failed to load and partition agent profiles:", e);
    agentLaunchProfileStore.partitionLaunchProfiles({}, []);
  }

  // Load team profiles using the corrected function name
  teamLaunchProfileStore.loadLaunchProfiles();
});
</script>
