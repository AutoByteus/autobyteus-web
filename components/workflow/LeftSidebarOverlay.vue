<template>
  <div class="workspace-workflow-selector h-full p-4">
    <!-- Workspace Selector Component -->
    <div class="mb-6">
      <WorkspaceSelector @workspace-selected="handleWorkspaceSelected" />
    </div>

    <!-- Workflow Section -->
    <div class="workflow-section" :class="{ 'opacity-50 pointer-events-none': !selectedWorkspaceId }">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Workflows</h2>
        <p v-if="!selectedWorkspaceId" class="text-sm text-gray-500">
          Select a workspace to view available workflows
        </p>
      </div>
      
      <WorkflowSteps v-if="selectedWorkspaceId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'
import WorkflowSteps from './WorkflowSteps.vue'

const workspaceStore = useWorkspaceStore()

const selectedWorkspaceId = computed(() => workspaceStore.currentSelectedWorkspaceId)

const handleWorkspaceSelected = (workspaceId: string) => {
  // Additional handling if needed when workspace is selected
}
</script>

<style scoped>
.workspace-workflow-selector {
  height: 100%;
  overflow-y: auto;
}

.workflow-section {
  transition: opacity 0.2s ease;
}
</style>
