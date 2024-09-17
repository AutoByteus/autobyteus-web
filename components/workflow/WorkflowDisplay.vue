<template>
  <div v-if="error" class="alert alert-error">
    <i class="fas fa-exclamation-triangle"></i> {{ error }}
  </div>
  <div v-if="loading" class="alert alert-info">
    <i class="fas fa-spinner fa-spin"></i> Loading...
  </div>

  <div class="workflow-container" v-if="workflow">
    <div class="workflow-steps">
      <WorkflowStep
        v-for="step in steps"
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
const error = ref<string | null>(null)

const fetchWorkflow = async () => {
  loading.value = true
  error.value = null
  try {
      workflowStore.fetchWorkflowConfig(workspaceStore.selectedWorkspacePath)
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch workflow.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkflow)

watch(() => workspaceStore.selectedWorkspacePath, fetchWorkflow)

const workflow = computed(() => workflowStore.currentWorkflow)
const selectedStepId = computed(() => workflowStore.currentSelectedStepId)

// Computed property for steps with default empty array
const steps = computed(() => Object.values(workflow.value?.steps || {}))

watch(steps, (stepsArray) => {
  if (stepsArray.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(stepsArray[0].id)
  }
})
</script>
