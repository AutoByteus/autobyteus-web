<template>
  <div class="flex flex-col h-screen bg-gray-100 p-2 sm:p-5 font-sans text-gray-800">
    <WorkspaceSelector class="bg-gray-200 p-2 sm:p-4 rounded-lg mb-4" />

    <PanelContainer class="flex-grow" :initial-layout="initialLayout">
      <template #panel-file-explorer>
        <PanelContent title="File Explorer">
          <FileExplorer />
        </PanelContent>
      </template>
      <template #panel-file-content>
        <PanelContent title="File Content">
          <ContentViewer />
        </PanelContent>
      </template>
      <template #panel-workflow>
        <PanelContent title="Workflow">
          <WorkflowLayout />
        </PanelContent>
      </template>
    </PanelContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WorkspaceSelector from "~/components/workspace/WorkspaceSelector.vue";
import FileExplorer from "~/components/fileExplorer/FileExplorer.vue";
import ContentViewer from "~/components/fileExplorer/FileContentViewer.vue";
import WorkflowLayout from "~/components/workflow/WorkflowLayout.vue";
import PanelContainer from "~/components/layout/PanelContainer.vue";
import PanelContent from "~/components/layout/PanelContent.vue";

const initialLayout = ref([
  { id: 'file-explorer', width: 20 },
  { id: 'file-content', width: 40 },
  { id: 'workflow', width: 40 }
]);
</script>