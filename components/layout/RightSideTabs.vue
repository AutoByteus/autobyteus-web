<template>
  <div class="flex flex-col h-full">
    <!-- If you anticipate more tabs eventually, you can keep this structure.
         For now, Terminal is the only tab. -->
    <TabList
      :tabs="tabs"
      :selectedTab="activeTab"
      @select="setActiveTab"
    />

    <!-- Tab Content -->
    <div class="flex-grow overflow-auto mt-2">
      <div v-show="activeTab === 'Terminal'" class="h-full">
        <Terminal />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TabList from '~/components/tabs/TabList.vue'
import Terminal from '~/components/workflow/Terminal.vue'

const activeTab = ref('Terminal')
const tabs = [
  { name: 'Terminal' }
]

const setActiveTab = (tabName: string) => {
  activeTab.value = tabName
}
</script>

<style scoped>
.mt-2 {
  margin-top: 0.5rem;
}
</style>
