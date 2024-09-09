<template>
  <div v-if="error" class="alert alert-error">
    <i class="fas fa-exclamation-triangle"></i> Something went wrong...
  </div>
  <div v-if="loading" class="alert alert-info">
    <i class="fas fa-spinner fa-spin"></i> Loading...
  </div>

  <div class="workflow-container" v-if="workflow">
    <div class="workflow-steps">
      <WorkflowStep
        v-for="step in Object.values(workflow.steps)"
        :key="step.id"
        :step="step"
        :isSelected="selectedStepId === step.id"
      />
    </div>

    <WorkflowStepDetails />
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { GetWorkflowConfig } from '~/graphql/queries'
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql'
import { computed } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import { useWorkflowStore } from '~/stores/workflow'
import { deserializeWorkflow } from '~/utils/JSONParser'

const workspaceStore = useWorkspaceStore()
const workflowStore = useWorkflowStore()

const { result, loading, error } = useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(
  GetWorkflowConfig,
  () => ({
    workspaceRootPath: workspaceStore.selectedWorkspacePath
  })
)

const workflow = computed(() => {
  if (!result.value?.workflowConfig) {
    return null
  }
  try {
    const parsedWorkflow = deserializeWorkflow(result.value.workflowConfig)
    workflowStore.setWorkflow(parsedWorkflow)
    return parsedWorkflow
  } catch (err) {
    console.error('Failed to parse workflowConfig JSON', err)
    return null
  }
})

const selectedStepId = computed(() => workflowStore.selectedStepId)

watch(() => Object.values(workflow.value?.steps || {}), (steps) => {
  if (steps.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(steps[0].id)
  }
})
</script>

<style scoped>
/* ... (keep existing styles) ... */
</style>