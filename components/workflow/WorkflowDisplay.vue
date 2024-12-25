<template>
  <div class="flex flex-col h-[calc(100vh-12rem)]">
    <!-- Alerts at top -->
    <div v-if="error" class="flex-shrink-0 alert alert-error mb-4 p-4 bg-red-100 text-red-700 rounded-md">
      <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
    </div>
    <div v-if="loading" class="flex-shrink-0 alert alert-info mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
      <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
    </div>

    <!-- Main workflow container -->
    <div v-if="workflow" class="flex flex-col flex-grow">
      <!-- Fixed header -->
      <div class="flex-shrink-0 bg-white">
        <div class="workflow-steps flex flex-wrap gap-3 mb-6">
          <WorkflowStep
            v-for="step in steps"
            :key="step.id"
            :step="step"
            :isSelected="selectedStepId === step.id"
          />
        </div>
      </div>

      <!-- Content and Terminal Container -->
      <div class="flex-grow flex">
        <!-- Workflow Step Details -->
        <div class="flex-grow overflow-y-auto">
          <WorkflowStepDetails />
        </div>
        <!-- Terminal Panel -->
        <div class="w-1/3 ml-4">
          <Terminal />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWorkspaceStore } from '~/stores/workspace';
import { useWorkflowStore } from '~/stores/workflow';
import WorkflowStepDetails from '~/components/workflow/WorkflowStepDetails.vue';
import WorkflowStep from '~/components/workflow/WorkflowStep.vue';
import Terminal from '~/components/workflow/Terminal.vue';

const workspaceStore = useWorkspaceStore();
const workflowStore = useWorkflowStore();

const loading = ref(false);
const error = ref<string | null>(null);

const fetchWorkflow = async () => {
  if (!workspaceStore.currentSelectedWorkspaceId) {
    // Do not attempt to fetch workflow if no workspace is selected
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    await workflowStore.fetchWorkflowConfig(workspaceStore.currentSelectedWorkspaceId);
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch workflow.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchWorkflow);

watch(
  () => workspaceStore.currentSelectedWorkspaceId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchWorkflow();
    }
  }
);

const workflow = computed(() => workflowStore.currentWorkflow);
const selectedStepId = computed(() => workflowStore.currentSelectedStepId);
const steps = computed(() => Object.values(workflow.value?.steps || {}));

watch(steps, (stepsArray) => {
  if (stepsArray.length > 0 && !selectedStepId.value) {
    workflowStore.setSelectedStepId(stepsArray[0].id);
  }
});
</script>

<style scoped>
/* Add any additional styles if necessary */
</style>
