<template>
  <div class="prompt-editor">
    <!-- Single editor for the entire prompt -->
    <textarea 
        class="entire-prompt-editor"
        v-model="entirePrompt"
    ></textarea>

    <!-- Display editors for placeholders -->
    <div v-for="placeholder in placeholders" :key="placeholder" class="input-container">
      <label :for="placeholder">{{ placeholder }}</label>
      <textarea 
          :id="placeholder"
          v-model="values[placeholder]" 
          :placeholder="placeholder" 
          class="segment-input"
          rows="3"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getPlaceholders } from '../../utils/PromptParser';

const props = defineProps<{ template: string }>();

const entirePrompt = ref(props.template);
const placeholders = computed(() => getPlaceholders(props.template));

const values: { [key: string]: string } = ref({});

watch(entirePrompt, (newVal) => {
    const newPlaceholders = getPlaceholders(newVal);
    newPlaceholders.forEach((ph) => {
        if (!values[ph]) values[ph] = '';
    });
});
</script>

<style>
.prompt-editor {
  font-family: "Roboto", sans-serif;
  background-color: #f4f4f8;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.entire-prompt-editor, .segment-input {
  box-sizing: border-box; 
  width: 100%;
  border: 1px solid #ccc;
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 16px;
  color: #333;
  white-space: pre-wrap;
  overflow-y: auto;
  resize: vertical;
}

.entire-prompt-editor:hover, .segment-input:hover {
  border-color: #666;
  transform: scale(1.01);
}

.entire-prompt-editor:focus, .segment-input:focus {
  border-color: #007BFF;
  outline: none;
  box-shadow: 0 0 5px rgba(0,123,255,0.6);
  transform: scale(1.03);
}

.input-container {
  margin: 15px 0;
}

.input-container label {
  display: block;
  margin-bottom: 7px;
  font-weight: 600;
  color: #444;
}
</style>
