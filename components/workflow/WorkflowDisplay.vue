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
    <div v-if="workflow" class="flex flex-col flex-grow relative">
      <!-- 
        The new WorkflowSteps component is toggled by isWorkflowOpen. 
        It displays steps vertically and automatically closes on step selection.
      -->
      <transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="isWorkflowOpen"
          class="absolute inset-0 bg-white border-r border-gray-200 p-4 z-10 w-full sm:w-60 overflow-auto"
        >
          <h2 class="text-lg font-bold mb-4">Select a Step</h2>
          <WorkflowSteps />
        </div>
      </transition>

      <!-- The rest of the container holds the selected step view (WorkflowStepView). -->
      <div class="flex-grow p-4">
        <WorkflowStepView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWorkspaceStore } from '~/stores/workspace';
import { useWorkflowStore } from '~/stores/workflow';
import { useWorkflowUIStore } from '~/stores/workflowUI';
import WorkflowStepView from '~/components/workflow/WorkflowStepView.vue';
import WorkflowSteps from '~/components/workflow/WorkflowSteps.vue';

const workspaceStore = useWorkspaceStore();
const workflowStore = useWorkflowStore();
const workflowUIStore = useWorkflowUIStore();

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
const isWorkflowOpen = computed(() => workflowUIStore.isWorkflowOpen);
</script>

<style scoped>
/* Additional style rules if needed */
</style>
