<template>
  <div class="md:hidden flex flex-1 flex-col min-h-0">
    <!-- Mobile Navigation -->
    <div class="flex bg-white shadow p-2 gap-2 overflow-x-auto">
      <button 
        v-for="(tab, index) in availableTabs"
        :key="index"
        @click="handleTabClick(tab.id)"
        :class="[
          'flex-shrink-0 py-2 px-4 rounded-md transition-colors whitespace-nowrap',
          activeMobilePanel === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Mobile Panels -->
    <div class="flex-1 bg-white shadow overflow-hidden relative mt-2"> 
      <!-- File Explorer -->
      <div v-if="activeLaunchProfileHasWorkspace" v-show="activeMobilePanel === 'explorer'" class="h-full p-0 overflow-auto">
        <FileExplorer />
      </div>

      <!-- Content Viewer -->
      <div v-show="activeMobilePanel === 'content'" class="h-full p-0 overflow-auto">
        <FileContentViewer :expandedMode="true" />
      </div>

      <!-- Launch Profile Panel -->
      <div v-show="activeMobilePanel === 'profiles'" class="h-full p-0 overflow-auto">
        <LaunchProfilePanel />
      </div>

      <!-- Agent View -->
      <div v-show="activeMobilePanel === 'agent'" class="h-full p-0 overflow-auto">
        <AgentWorkspaceView />
      </div>

      <!-- Terminal -->
      <div v-show="activeMobilePanel === 'terminal'" class="h-full p-0 overflow-auto">
        <RightSideTabs />
      </div>
    </div>

    <!-- Floating action buttons -->
    <div class="fixed bottom-4 right-4 flex flex-col gap-2">
      <!-- Content editor button -->
      <button
        v-if="showFileContent && activeMobilePanel !== 'content'"
        @click="activeMobilePanel = 'content'"
        class="px-4 py-2 bg-blue-500 text-white rounded shadow-lg z-20 text-sm"
      >
        Open Editor
      </button>

      <!-- Agent profile button -->
      <button
        v-if="activeMobilePanel === 'agent' && !activeProfileId"
        @click="activeMobilePanel = 'profiles'"
        class="px-4 py-2 bg-blue-500 text-white rounded shadow-lg z-20 text-sm"
      >
        Select Profile
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import FileContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import LaunchProfilePanel from '~/components/launchProfiles/LaunchProfilePanel.vue'
import AgentWorkspaceView from '~/components/workspace/AgentWorkspaceView.vue'
import RightSideTabs from './RightSideTabs.vue'
import { useMobilePanels } from '~/composables/useMobilePanels'
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore'

const props = defineProps<{  
  showFileContent: boolean
}>()

const launchProfileStore = useAgentLaunchProfileStore()
const { activeMobilePanel } = useMobilePanels()

const activeProfileId = computed(() => launchProfileStore.activeProfileId)
const activeLaunchProfileHasWorkspace = computed(() => !!launchProfileStore.activeLaunchProfile?.workspaceId)

const availableTabs = computed(() => {
  const tabs = [
    ...(activeLaunchProfileHasWorkspace.value ? [{ id: 'explorer', label: 'Files' }] : []),
    { id: 'profiles', label: 'Profiles' },
    { id: 'agent', label: 'Agent' },
    { id: 'terminal', label: 'Terminal' }
  ]
  
  if (props.showFileContent && activeLaunchProfileHasWorkspace.value) {
    const explorerIndex = tabs.findIndex(t => t.id === 'explorer');
    if (explorerIndex !== -1) {
      tabs.splice(explorerIndex + 1, 0, { id: 'content', label: 'Content' });
    }
  }
  
  return tabs
})

// Handle tab clicks with special logic for agent/profiles
const handleTabClick = (tabId: string) => {
  // If clicking agent tab without an active profile,
  // redirect to profiles tab first
  if (tabId === 'agent' && !activeProfileId.value) {
    activeMobilePanel.value = 'profiles'
  } else {
    activeMobilePanel.value = tabId
  }
}
</script>

<style scoped>
.h-full {
  transition: all 0.3s ease-in-out;
}

.fixed {
  position: fixed;
}

/* Enable horizontal scroll for tabs on very small screens */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
