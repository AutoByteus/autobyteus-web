<template>
  <div class="workflow-step"
       :class="{ selected: isSelected }"
       @click="selectStep">
    <h3>{{ stepName }}</h3>
  </div>
</template>

<script setup lang="ts">
import { inject, Ref, computed, defineProps } from 'vue';

const props = defineProps<{ stepName: string }>();
const selectedStep = inject<Ref<string | null>>('selectedStep')!;

const selectStep = () => {
  selectedStep.value = props.stepName;
}

const isSelected = computed(() => selectedStep.value === props.stepName);
</script>

<style scoped>
.workflow-step {
  flex: 1 0 20%; /* grow, shrink, basis */
  border: 1px solid #000;
  border-radius: 5px;
  padding: 10px;
  box-sizing: border-box;
}

.workflow-step.selected {
  background-color: #ddd; /* Change this to whatever color you want for a selected step */
}
</style>
