<template>
  <div class="flex flex-col h-full bg-gray-100 p-5 sm:p-5 font-sans text-gray-800">
    <Transition
      enter-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="opacity-0 transform -translate-y-4"
      enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition-all duration-300 ease-in-out"
      leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-4"
    >
      <WorkspaceSelector
        v-if="isWorkspaceSelectorVisible"
        class="bg-gray-200 p-4 rounded-lg mb-6 flex-shrink-0"
      />
    </Transition>
    
    <DesktopLayout :show-file-content="showFileContent" />
    <MobileLayout :show-file-content="showFileContent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'
import DesktopLayout from '~/components/layout/DesktopLayout.vue'
import MobileLayout from '~/components/layout/MobileLayout.vue'

const fileExplorerStore = useFileExplorerStore()
const workspaceUIStore = useWorkspaceUIStore()

const showFileContent = computed(() => fileExplorerStore.openFiles.length > 0)
const isWorkspaceSelectorVisible = computed(() => workspaceUIStore.isWorkspaceSelectorVisible)
</script>