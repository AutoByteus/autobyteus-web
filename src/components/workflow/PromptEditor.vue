<template>
  <div class="prompt-editor">
    <!-- Display complete prompt first with placeholders -->
    <div v-for="segment in segments" :key="segment.placeholder || segment">
      <span v-if="typeof segment === 'string'" class="segment-content">{{ segment }}</span>
      
      <!-- Display variable placeholder in a distinct style in the content -->
      <span v-else class="variable-placeholder">{{ segment.placeholder }}</span>
    </div>

    <!-- All variable inputs will appear below the content -->
    <div v-for="segment in segments.filter(s => typeof s !== 'string')" :key="segment.placeholder" class="input-container">
      <label :for="segment.placeholder">{{ segment.placeholder }}</label>
      <textarea 
          :id="segment.placeholder"
          v-model="values[segment.placeholder]" 
          :placeholder="segment.placeholder" 
          class="segment-input"
          rows="3"
      ></textarea>
    </div>
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
.prompt-editor {
  font-family: "Arial", sans-serif;
  white-space: pre; /* Preserve whitespace */
}

/* Styling for content segments */
.segment-content {
  display: inline-block;
  margin: 5px 0;
  padding: 5px;
  color: #555;
}

/* Highlight variable placeholders in the content */
.variable-placeholder {
  display: inline-block;
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin: 2px;
  font-weight: 600;
}

/* Styling for the variable input */
.input-container {
  margin: 10px 0;
}

.input-container label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.prompt-editor textarea.segment-input {
  width: 100%;
  border: 1px solid #ccc;
  padding: 10px 15px;
  margin: 2px 0;
  border-radius: 4px;
  transition: border-color 0.3s ease;
  resize: vertical;
  min-height: 60px;
  max-height: 300px;
  font-size: 16px;
  color: #333;
}

.prompt-editor textarea.segment-input:hover {
  border-color: #888;
}

.prompt-editor textarea.segment-input:focus {
  border-color: #007BFF;
  outline: none;
  box-shadow: 0 0 3px rgba(0,123,255,0.5);
}
</style>
