<template>
  <div class="md:hidden flex flex-1 flex-col min-h-0">
    <!-- Mobile Navigation -->
    <div class="flex mb-4 bg-white rounded-lg shadow p-2 gap-2">
      <button 
        v-for="(tab, index) in availableTabs"
        :key="index"
        @click="activeMobilePanel = tab.id"
        :class="[
          'flex-1 py-2 px-4 rounded-md transition-colors',
          activeMobilePanel === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 
      For mobile, we'll adapt the same logic in a simpler way:
       - If a file is open, we show a small 'preview' button at the bottom.
       - Clicking that button navigates the user to the "content" tab in expanded mode.
       - The user can then switch back to 'explorer', 'workflow', or 'terminal'.
      This is simpler than the desktop's floating approach, but it similarly addresses space constraints.
    -->

    <!-- Minimally, let's keep the original structure. We'll highlight the "Content" tab if a file is open. -->

    <!-- Mobile Panels -->
    <div class="flex-1 bg-white rounded-lg shadow overflow-hidden relative">
      <!-- File Explorer -->
      <div v-show="activeMobilePanel === 'explorer'" class="h-full p-4 overflow-auto">
        <FileExplorer />
      </div>

      <!-- Content Viewer -->
      <div v-show="activeMobilePanel === 'content'" class="h-full p-4 overflow-auto">
        <ContentViewer :expandedMode="true" />
      </div>

      <!-- Workflow Display -->
      <div v-show="activeMobilePanel === 'workflow'" class="h-full p-4 overflow-auto">
        <WorkflowDisplay />
      </div>

      <!-- Terminal (using the same RightSideTabs component, but it only has Terminal now) -->
      <div v-show="activeMobilePanel === 'terminal'" class="h-full p-4 overflow-auto">
        <RightSideTabs />
      </div>
    </div>

    <!-- Simple floating button if a file is open but user is on a different tab 
         so user can quickly jump to "Content" tab. -->
    <button
      v-if="showFileContent && activeMobilePanel !== 'content'"
      @click="activeMobilePanel = 'content'"
      class="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded shadow-lg z-20 text-sm"
    >
      Open Editor
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowDisplay from '~/components/workflow/WorkflowDisplay.vue'
import RightSideTabs from './RightSideTabs.vue'
import { useMobilePanels } from '~/composables/useMobilePanels'
import { useFileExplorerStore } from '~/stores/fileExplorer'

const props = defineProps<{  
  showFileContent: boolean
}>()

// On mobile, we have distinct panels for Explorer, Content, Workflow, Terminal
const { activeMobilePanel } = useMobilePanels()

// Insert 'content' tab dynamically if showFileContent is true
const availableTabs = computed(() => {
  const tabs = [
    { id: 'explorer', label: 'Files' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'terminal', label: 'Terminal' }
  ]
  if (props.showFileContent) {
    // Insert the 'content' tab right after 'explorer'
    // If it's already there, we won't duplicate it
    const existingContentTab = tabs.find(tab => tab.id === 'content')
    if (!existingContentTab) {
      tabs.splice(1, 0, { id: 'content', label: 'Content' })
    }
  }
  return tabs
})
</script>

<style scoped>
.h-full {
  transition: all 0.3s ease-in-out;
}

.fixed {
  position: fixed;
}
</style>
