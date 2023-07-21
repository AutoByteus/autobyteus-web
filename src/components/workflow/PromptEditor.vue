<!-- src/components/workflow/PromptEditor.vue -->
<template>
    <div class="prompt-editor">
      <template v-for="segment in segments">
        <span v-if="typeof segment === 'string'" :key="segment">{{ segment }}</span>
        <input v-else :key="segment.placeholder" v-model="values[segment.placeholder]" :placeholder="segment.placeholder">
      </template>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { parsePromptTemplate } from '../../utils/PromptParser';
  
  const props = defineProps<{ template: string }>();
  const segments = parsePromptTemplate(props.template);
  
  const values: { [key: string]: string } = ref({});
  </script>
  
  <style>
  .prompt-editor input {
    /* Add styling for the input boxes */
  }
  </style>
  