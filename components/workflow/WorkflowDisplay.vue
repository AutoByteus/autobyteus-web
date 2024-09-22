<template>
  <div v-if="error" class="alert alert-error mb-4 p-4 bg-red-100 text-red-700 rounded-md">
    <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
  </div>
  <div v-if="loading" class="alert alert-info mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
    <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
  </div>

  <div class="workflow-container" v-if="workflow">
    <div class="workflow-steps flex overflow-x-auto mb-6 pb-2">
      <WorkflowStep
        v-for="step in steps"
        :key="step.id"
        :step="step"
        :isSelected="selectedStepId === step.id"
        class="flex-shrink-0"
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
    await workflowStore.fetchWorkflowConfig(workspaceStore.selectedWorkspacePath)
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
const steps = computed(() => Object.values(workflow.value?.steps || {}))

watch(steps, (stepsArray) => {
  if (stepsArray.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(stepsArray[0].id)
  }
})
</script>

<style scoped>
.workflow-steps {
  scrollbar-width: thin;
  scrollbar-color: #4A5568 #EDF2F7;
}

.workflow-steps::-webkit-scrollbar {
  height: 6px;
}

.workflow-steps::-webkit-scrollbar-track {
  background: #EDF2F7;
}

.workflow-steps::-webkit-scrollbar-thumb {
  background-color: #4A5568;
  border-radius: 3px;
}
</style>