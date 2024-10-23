<template>
  <div class="flex-1 flex flex-col bg-gray-50 p-4 space-y-6 overflow-y-auto">
    <!-- Error and Loading States -->
    <div v-if="error" class="m-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm" role="alert">
      <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
    </div>
    <div v-if="loading" class="m-4 p-4 bg-blue-100 text-blue-700 rounded-lg shadow-sm" role="alert">
      <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
    </div>

    <!-- Workflow Content -->
    <div v-if="workflow" class="flex-1 flex flex-col space-y-6">
      <!-- Top Navigation with Steps -->
      <nav class="bg-white border-b shadow-sm px-4 py-3">
        <ul class="flex space-x-3 min-w-max overflow-x-auto" role="tablist">
          <li v-for="(step, index) in steps" :key="step.id">
            <WorkflowStep
              :step="step"
              :step-number="index + 1"
              :is-selected="selectedStepId === step.id"
              :is-last-step="index === steps.length - 1"
            />
          </li>
        </ul>
      </nav>

      <!-- Main Content Area with Scrollbar -->
      <main class="flex-1 overflow-y-auto flex flex-col p-4 space-y-4">
        <WorkflowStepDetails />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import { useWorkflowStore } from '~/stores/workflow'
import WorkflowStepDetails from '~/components/workflow/WorkflowStepDetails.vue'
import WorkflowStep from '~/components/workflow/WorkflowStep.vue'

const workspaceStore = useWorkspaceStore()
const workflowStore = useWorkflowStore()
const loading = ref(false)
const error = ref<string | null>(null)

const fetchWorkflow = async () => {
  loading.value = true
  error.value = null
  try {
    await workflowStore.fetchWorkflowConfig(workspaceStore.currentSelectedWorkspaceId)
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch workflow.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkflow)
watch(() => workspaceStore.currentSelectedWorkspaceId, fetchWorkflow)

const workflow = computed(() => workflowStore.currentWorkflow)
const selectedStep = computed(() => workflowStore.selectedStep)
const selectedStepId = computed(() => workflowStore.currentSelectedStepId)
const steps = computed(() => Object.values(workflow.value?.steps || {}))

watch(steps, (stepsArray) => {
  if (stepsArray.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(stepsArray[0].id)
  }
})
</script>

<style scoped>
.min-h-0 {
  min-height: 0;
}
</style>