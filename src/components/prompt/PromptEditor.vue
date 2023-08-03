<template>
  <div class="prompt-editor">
    <Collapsible>
      <ResizableTextArea 
          v-model="entirePrompt" 
          class="entire-prompt-editor"
      />
    </Collapsible>

    <Collapsible>
      <div 
          v-for="promptTemplateVariable in promptTemplateVariables" 
          :key="promptTemplateVariable.name" 
          class="input-container">
        <label :for="promptTemplateVariable.name">{{ promptTemplateVariable.name }}</label>
        <ResizableTextArea 
            v-model="values[promptTemplateVariable.name]" 
            :placeholder="promptTemplateVariable.name" 
            class="placeholder-input"
        />
      </div>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, Ref } from 'vue';
import Collapsible from '../utils/Collapsible.vue';
import ResizableTextArea from '../utils/ResizableTextArea.vue';
import type { PromptTemplate } from '../../types/Workflow';

const props = defineProps<{ template: PromptTemplate }>();
const emit = defineEmits();

const entirePrompt = ref(props.template.template);
const promptTemplateVariables = computed(() => 
  props.template.variables.filter(variable => variable.source === 'USER_INPUT')
);
const values: Ref<{ [key: string]: string }> = reactive({});

// Watch for changes in the values object and emit updated value
watch(values, (newValues, oldValues) => {
  for (const key in newValues) {
    if (newValues[key] !== oldValues[key]) {
      emit('update:variable', { variableName: key, value: newValues[key] });
      break;
    }
  }
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

