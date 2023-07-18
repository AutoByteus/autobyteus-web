<template>
  <div class="app">
    <WorkspaceSelector class="app-workspace-selector" />

    <div class="app-content">
      <div class="app-row">
        <FileExplorer class="app-file-explorer" />

        <div class="app-panel">
          <TabList :tabs="tabs" @changeTab="activeTab = $event"></TabList>
          
          <component :is="activeTab.component" />
        </div>
      </div>
    </div>

    <div class="clear"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WorkspaceSelector from "./components/workspace/WorkspaceSelector.vue";
import FileExplorer from "./components/fileExplorer/FileExplorer.vue";
import ContentViewer from "./components/fileExplorer/FileContentViewer.vue";
import WorkflowDisplay from "./components/workflow/WorkflowDisplay.vue";
import TabList from "./components/tabs/TabList.vue";

const tabs = [
  { name: 'File', component: ContentViewer },
  { name: 'Agent', component: WorkflowDisplay }
];

const activeTab = ref(tabs[0]);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.app {
  font-family: 'Roboto', sans-serif;
  color: #333;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
  width: 100%;
}

h1 {
  margin-bottom: 20px;
}

.app-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.app-row {
  display: flex;
  flex-direction: row;
}

.app-workspace-selector {
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.app-file-explorer {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
  min-width: 10%; /* Smallest width allowed */
  max-width: 30%; /* Maximum width allowed */
  height: 100%;
  overflow: auto; /* In case content is larger than the maximum width allowed */
}

.app-panel {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
  margin-left: 20px;
  flex-grow: 1;
  height: 100%;
}

.clear {
  clear: both;
}
</style>
