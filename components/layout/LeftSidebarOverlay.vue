```vue
<template>
  <div class="h-full p-4">
    <!-- Workspace Section -->
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
import WorkspaceSelector from '../workspace/WorkspaceSelector.vue'
import WorkflowSteps from '../workflow/WorkflowSteps.vue'

const workspaceStore = useWorkspaceStore()

const selectedWorkspaceId = computed(() => workspaceStore.currentSelectedWorkspaceId)

const handleWorkspaceSelected = (workspaceId: string) => {
  // Additional handling if needed when workspace is selected
}
</script>

<style scoped>
.workflow-section {
  transition: opacity 0.2s ease;
}
</style>
```

This component:
1. Uses the improved WorkspaceSelector component
2. Maintains the workflow list display
3. Keeps the opacity transition for non-selected workspace state
4. Has cleaner organization with proper spacing

Let me know if you'd like any adjustments to the layout or styling!