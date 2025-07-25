<template>
  <div class="flex flex-col h-full pt-2">
    <TabList
      :tabs="tabs"
      :selectedTab="activeTab"
      @select="setActiveTab"
    />

    <!-- Tab Content - added top border for separation -->
    <div class="flex-grow overflow-auto relative border-t border-gray-200">
      <!-- Use v-if instead of v-show to actually mount/unmount components -->
      <div v-if="activeTab === 'Terminal'" class="h-full">
        <Terminal />
      </div>
      <div v-if="activeTab === 'VNC Viewer'" class="h-full">
        <VncViewer />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TabList from '~/components/tabs/TabList.vue'
import Terminal from '~/components/workspace/Terminal.vue'
import VncViewer from '~/components/workspace/VncViewer.vue'

const activeTab = ref('Terminal')
const tabs = [
  { name: 'Terminal' },
  { name: 'VNC Viewer' }
]

const setActiveTab = (tabName: string) => {
  activeTab.value = tabName;
}
</script>

<style scoped>
/* Ensure content fills available space */
.flex-grow {
  display: flex;
  flex-direction: column;
}

.h-full {
  height: 100%;
}
</style>
