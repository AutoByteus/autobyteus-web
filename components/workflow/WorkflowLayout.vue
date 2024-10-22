<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Error and Loading States -->
    <div v-if="error" class="m-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm" role="alert">
      <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
    </div>
    <div v-if="loading" class="m-4 p-4 bg-blue-100 text-blue-700 rounded-lg shadow-sm" role="alert">
      <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
    </div>

    <!-- Workflow Content -->
    <div v-if="workflow" class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Sidebar with Steps -->
      <aside class="w-full lg:w-80 xl:w-96 border-r bg-white flex flex-col shadow-sm">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-semibold text-gray-900">Workflow Steps</h2>
        </div>
        <nav class="flex-1 overflow-y-auto">
          <ul class="p-6 space-y-4" role="tablist">
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
      </aside>

      <!-- Right Content Area -->
      <main class="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        <header class="bg-white shadow px-6 py-4 border-b">
          <h1 class="text-2xl font-semibold text-gray-800">Step Details</h1>
        </header>
        <section class="flex-1 overflow-y-auto p-6">
          <WorkflowStepDetails />
        </section>
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
const selectedStepId = computed(() => workflowStore.currentSelectedStepId)
const steps = computed(() => Object.values(workflow.value?.steps || {}))

watch(steps, (stepsArray) => {
  if (stepsArray.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(stepsArray[0].id)
  }
})
</script>

<style scoped>
/* Optional: Add any scoped styles if necessary */
</style>