<template>
  <!-- Workflow Steps in a Row -->
  <div class="workflow-step" :class="{ selected: isSelected }" @click="selectStep(step)">
    <h3>{{ step.name }}</h3>
  </div>
</template>

<script setup lang="ts">
import {  inject, Ref } from 'vue';
import type { Step } from '../../types/Workflow';

const props = defineProps<{ step: Step, isSelected: boolean }>();
const selectedStep = inject<Ref<Step | null>>('selectedStep')!;

const selectStep = (step: Step) => {
  selectedStep.value = step;
}
</script>

<style scoped>
.workflow-step {
  flex: 1 0 auto;
  border: 1px solid #000;
  border-radius: 5px;
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  margin-right: 10px;
}

.workflow-step:last-child {
  margin-right: 0;
}

.workflow-step.selected {
  background-color: #ddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
