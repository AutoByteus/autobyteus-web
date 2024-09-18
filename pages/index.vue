<template>
  <div class="flex flex-col h-screen bg-gray-100 p-2 sm:p-5 font-sans text-gray-800">
    <WorkspaceSelector class="bg-gray-200 p-2 sm:p-4 rounded-lg mb-4" />

    <div class="flex-grow flex flex-col sm:flex-row overflow-hidden">
      <div class="w-full sm:w-1/4 mb-4 sm:mb-0 sm:mr-5 flex flex-col">
        <FileExplorer class="bg-white p-2 sm:p-5 rounded-lg shadow-md flex-grow overflow-hidden" />
      </div>

      <div class="flex-grow bg-white p-2 sm:p-5 rounded-lg shadow-md overflow-auto">
        <TabList :tabs="tabs" :selectedTab="activeTab" @select="changeTab" />
        
        <component :is="components[activeTab]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import WorkspaceSelector from "~/components/workspace/WorkspaceSelector.vue";
import FileExplorer from "~/components/fileExplorer/FileExplorer.vue";
import ContentViewer from "~/components/fileExplorer/FileContentViewer.vue";
import WorkflowDisplay from "~/components/workflow/WorkflowDisplay.vue";
import TabList from "~/components/tabs/TabList.vue";

const tabs = shallowRef([
  { name: 'File' },
  { name: 'Workflow' }
]);

const components = {
  'File': ContentViewer,
  'Workflow': WorkflowDisplay
};

const activeTab = shallowRef('File');

const changeTab = (tabName: string) => {
  activeTab.value = tabName;
};
</script>