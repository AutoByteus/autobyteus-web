<template>
  <!-- Error & Loading Indicators -->
  <div v-if="error" class="alert alert-error">
    <i class="fas fa-exclamation-triangle"></i> Something went wrong...
  </div>
  <div v-if="loading" class="alert alert-info">
    <i class="fas fa-spinner fa-spin"></i> Loading...
  </div>

  <!-- Workflow Display -->
  <div class="workflow-container" v-if="workflow">
    <div class="workflow-steps">
      <WorkflowStep 
        v-for="step in Object.values(workflow.steps)" 
        :key="step.id"
        :step="step"
        :isSelected="selectedStep?.id === step.id"
      />
    </div>

    <!-- Workflow Step Details -->
    <WorkflowStepDetails />
  </div>
</template>


<script setup lang="ts">
import WorkflowStepDetails from './WorkflowStepDetails.vue';
import { useQuery } from "@vue/apollo-composable";
import { GetWorkflowConfig } from "../../graphql/queries";
import type { GetWorkflowConfigQuery as GetWorkflowConfigQueryType, GetWorkflowConfigQueryVariables } from "../../generated/graphql";
import WorkflowStep from './WorkflowStep.vue';
import { computed, provide, ref, watchEffect } from 'vue';
import { selectedWorkspacePath } from "../../store/workspaceState";
import type { Step } from '../../types/Workflow';
import { deserializeWorkflow } from '../../utils/JSONParser';

const workflowConfigQueryVarible: GetWorkflowConfigQueryVariables = { workspaceRootPath: selectedWorkspacePath }
const { result, loading, error } = useQuery<GetWorkflowConfigQueryType, GetWorkflowConfigQueryVariables>(
  GetWorkflowConfig, workflowConfigQueryVarible
);

const workflow = computed(() => {
  if (!result.value?.workflowConfig) {
    return null;
  }
  try {
    return deserializeWorkflow(result.value.workflowConfig);
  } catch (err) {
    console.error('Failed to parse workflowConfig JSON', err);
    return null;
  }
});

const selectedStep = ref<Step | null>(null);
provide('selectedStep', selectedStep);

watchEffect(() => {
  if (!selectedStep.value && workflow.value?.steps) {
    selectedStep.value = Object.values(workflow.value.steps)[0];
  }
});
</script>



<style scoped>
.workflow-container {
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.workflow-steps {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 1rem;
  gap: 1rem;
}

.workflow-steps > * {
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 5px;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
}

.alert-info {
  background-color: #cce5ff;
  color: #004085;
}
</style>
