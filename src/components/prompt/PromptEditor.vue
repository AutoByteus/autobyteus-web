<template>
  <div class="prompt-editor">
    <Collapsible>
      <ResizableTextArea 
          v-model="entirePrompt" 
          class="entire-prompt-editor"
      />
    </Collapsible>

    <Collapsible>
      <div v-for="placeholder in placeholders" :key="placeholder" class="input-container">
        <label :for="placeholder">{{ placeholder }}</label>
        <ResizableTextArea 
            v-model="values[placeholder]" 
            :placeholder="placeholder" 
            class="placeholder-input"
        />
      </div>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getPlaceholders } from '../../utils/PromptParser';
import Collapsible from '../Collapsible.vue';
import ResizableTextArea from '../ResizableTextArea.vue'; // Importing the new ResizableTextArea component

const props = defineProps<{ template: string }>();

const entirePrompt = ref(props.template);
const placeholders = computed(() => getPlaceholders(props.template));
const values: { [key: string]: string } = ref({});

</script>

<style>
.prompt-editor {
  font-family: "Roboto", sans-serif;
  background-color: #f4f4f8;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}


.entire-prompt-editor, .placeholder-input {
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
  overflow: hidden;  /* to avoid scrollbars */
}

.entire-prompt-editor:hover, .placeholder-input:hover {
  border-color: #666;
}

.entire-prompt-editor:focus, .placeholder-input:focus {
  border-color: #007BFF;
  outline: none;
  box-shadow: 0 0 5px rgba(0,123,255,0.6);
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

