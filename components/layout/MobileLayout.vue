
```vue
<!-- File: autobyteus-web/components/layout/MobileLayout.vue -->
<template>
  <div class="md:hidden flex flex-1 flex-col min-h-0">
    <!-- Mobile Navigation -->
    <div class="flex mb-4 bg-white rounded-lg shadow p-2 gap-2">
      <button 
        v-for="(tab, index) in availableTabs"
        :key="index"
        @click="activeMobilePanel = tab.id"
        :class="['flex-1 py-2 px-4 rounded-md transition-colors', 
                activeMobilePanel === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100']"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Mobile Panels -->
    <div class="flex-1 bg-white rounded-lg shadow overflow-hidden">
      <div v-show="activeMobilePanel === 'explorer'" class="h-full p-4 overflow-auto">
        <FileExplorer />
      </div>
      <div v-show="activeMobilePanel === 'content'" class="h-full p-4 overflow-auto">
        <ContentViewer />
      </div>
      <div v-show="activeMobilePanel === 'workflow'" class="h-full p-4 overflow-auto">
        <WorkflowDisplay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import ContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import WorkflowDisplay from '~/components/workflow/WorkflowDisplay.vue'
import { useMobilePanels } from '~/composables/useMobilePanels'

const props = defineProps<{
  showFileContent: boolean
}>()

const { activeMobilePanel } = useMobilePanels()

const availableTabs = computed(() => {
  const tabs = [
    { id: 'explorer', label: 'Files' },
    { id: 'workflow', label: 'Workflow' }
  ]
  
  if (props.showFileContent) {
    tabs.splice(1, 0, { id: 'content', label: 'Content' })
  }
  
  return tabs
})
</script>

<style scoped>
.h-full {
  transition: all 0.3s ease-in-out;
}
</style>
```
