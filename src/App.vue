<template>
  <div class="app">
    <h1>Workspace Explorer</h1>
    <WorkspaceSelector class="app-workspace-selector" />

    <div class="app-content">
      <FileExplorer class="app-file-explorer" />

      <TabList v-model="selectedTab" class="app-panel">
        <Tab name="ContentViewer">
          Content Viewer
        </Tab>
        <Tab name="WorkflowDisplay">
          Workflow Display
        </Tab>

        <template #ContentViewer>
          <ContentViewer />
        </template>

        <template #WorkflowDisplay>
          <WorkflowDisplay />
        </template>
      </TabList>
    </div>

    <div class="clear"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WorkspaceSelector from "./components/WorkspaceSelector.vue";
import FileExplorer from "./components/FileExplorer.vue";
import ContentViewer from "./components/ContentViewer.vue";
import WorkflowDisplay from "./components/workflow/WorkflowDisplay.vue";
import TabList from "./components/tabs/TabList.vue";
import Tab from "./components/tabs/Tab.vue";

const selectedTab = ref('ContentViewer');
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.app {
  font-family: 'Roboto', sans-serif;
  color: #333;
  background-color: #f4f4f4;
  padding: 20px;
  width: 100%;
}

h1 {
  margin-bottom: 20px;
}

.app-content {
  display: flex;
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
  width: 30%;
}

.app-panel {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
  margin-left: 20px;
  flex-grow: 1;
}

.clear {
  clear: both;
}
</style>
