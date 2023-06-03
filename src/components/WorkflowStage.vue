<template>
  <div class="workflow-stage" 
       :class="{ selected: isSelected }"
       @click="selectStage">
    <h3>{{ stageName }}</h3>
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject, Ref, computed } from 'vue';
const props = defineProps<{ stageName: string }>();
const selectedStage = inject<Ref<string | null>>('selectedStage')!;

const selectStage = () => {
  selectedStage.value = props.stageName;
}

const isSelected = computed(() => selectedStage.value === props.stageName);
</script>

<style scoped>
.workflow-stage {
  flex: 1 0 20%; /* grow, shrink, basis */
  border: 1px solid #000;
  border-radius: 5px;
  padding: 10px;
  box-sizing: border-box;
}

.workflow-stage.selected {
  background-color: #ddd; /* Change this to whatever color you want for a selected stage */
}
</style>
