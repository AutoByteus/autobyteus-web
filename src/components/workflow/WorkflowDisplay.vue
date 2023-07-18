<template>
  <p v-if="error">Something went wrong...</p>
  <p v-if="loading">Loading...</p>
  <div class="workflow-container" v-if="result">
    <div class="workflow-steps">
      <WorkflowStep 
        v-for="(_, key) in steps" 
        :key="key"
        :stepName="key" 
      />
    </div>
    <div class="workflow-details">
      <WorkflowStepDetails v-if="selectedStep" :stepName="selectedStep"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { GetWorkflowConfig } from "../../graphql/queries";
import type { GetWorkflowConfigQuery as GetWorkflowConfigQueryType } from "../../generated/graphql";
import WorkflowStep from './WorkflowStep.vue';
import WorkflowStepDetails from './WorkflowStepDetails.vue';
import { computed, provide, ref, watchEffect } from 'vue';

const { result, loading, error } = useQuery<GetWorkflowConfigQueryType>(GetWorkflowConfig);
const steps = computed(() => {
  if (!result.value?.workflowConfig) {
    return {};
  }
  try {
    const config = JSON.parse(result.value.workflowConfig);
    return config.steps || {};
  } catch (err) {
    console.error('Failed to parse workflowConfig JSON', err);
    return {};
  }
});

const selectedStep = ref<string | null>(null);
provide('selectedStep', selectedStep);

watchEffect(() => {
  if (!selectedStep.value && steps.value) {
    selectedStep.value = Object.keys(steps.value)[0]; // Sets selectedStep to the first step
  }
});
</script>

<style scoped>
.workflow-container {
  display: flex;
  flex-direction: column;
}
.workflow-steps {
  flex: 0 0 auto; /* As much space as it needs */
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 1rem;
  gap: 1rem;
}
.workflow-details {
  flex: 1 0 auto; /* As much space as it needs, but can grow if there's extra space */
  border: 1px solid #ccc; /* Adding a border */
  padding: 1rem; /* Optional: Add padding so content isn't pressed against the border */
}
</style>
