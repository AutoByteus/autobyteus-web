<template>
  <p v-if="error">Something went wrong...</p>
  <p v-if="loading">Loading...</p>
  <div class="workflow-container" v-if="result">
    <div class="workflow-stages">
      <WorkflowStage 
        v-for="(_, key) in stages" 
        :key="key"
        :stageName="key" 
      />
    </div>
    <div class="workflow-details">
      <WorkflowStageDetails v-if="selectedStage" :stageName="selectedStage"/>
    </div>
  </div>
</template>

  <script setup lang="ts">
  import { useQuery } from "@vue/apollo-composable";
  import { GetWorkflowConfig } from "../graphql/queries";
  import type { GetWorkflowConfigQuery as GetWorkflowConfigQueryType } from "../generated/graphql";
  import WorkflowStage from './WorkflowStage.vue';
  import WorkflowStageDetails from './WorkflowStageDetails.vue';
  import { computed, provide, ref } from 'vue';
  
  const { result, loading, error } = useQuery<GetWorkflowConfigQueryType>(GetWorkflowConfig);
  const stages = computed(() => {
    if (!result.value?.workflowConfig) {
      return {};
    }
    try {
      const config = JSON.parse(result.value.workflowConfig);
      return config.stages || {};
    } catch (err) {
      console.error('Failed to parse workflowConfig JSON', err);
      return {};
    }
  });

const selectedStage = ref(null);
provide('selectedStage', selectedStage);

</script>

<style scoped>
.workflow-container {
  display: flex;
  flex-direction: column;
}
.workflow-stages {
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

