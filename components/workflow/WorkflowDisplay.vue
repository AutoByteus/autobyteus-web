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
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import { useWorkflowStore } from '~/stores/workflow'

const workspaceStore = useWorkspaceStore()
const workflowStore = useWorkflowStore()

const loading = ref(false)
const error = ref(null)

const fetchWorkflow = async () => {
  const { loading: isLoading, error: fetchError } = await workflowStore.fetchWorkflowConfig(workspaceStore.selectedWorkspacePath)
  loading.value = isLoading
  error.value = fetchError
}

onMounted(fetchWorkflow)

watch(() => workspaceStore.selectedWorkspacePath, fetchWorkflow)

const workflow = computed(() => workflowStore.workflow)
const selectedStepId = computed(() => workflowStore.selectedStepId)

watch(() => Object.values(workflow.value?.steps || {}), (steps) => {
  if (steps.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(steps[0].id)
  }
})
</script>
