<template>
  <div class="prompt-editor bg-gray-100 p-4 rounded-lg shadow-md">
    <Collapsible>
      <ResizableTextArea 
          v-model="entirePrompt" 
          class="w-full border border-gray-300 p-3 mb-5 rounded-md transition-all duration-300 ease-in-out text-gray-800 text-base resize-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:border-gray-400"
      />
    </Collapsible>

    <Collapsible class="placeholders-section">
      <div 
          v-for="promptTemplateVariable in promptTemplateVariables" 
          :key="promptTemplateVariable.name" 
          class="mb-4">
        <label 
            :for="promptTemplateVariable.name"
            class="block mb-2 font-semibold text-gray-700"
        >
          {{ promptTemplateVariable.name }}
        </label>
        <ResizableTextArea 
            :modelValue="values[promptTemplateVariable.name]" 
            @update:modelValue="updateValue(promptTemplateVariable.name, $event)"
            :placeholder="promptTemplateVariable.name" 
            class="w-full border border-gray-300 p-3 rounded-md transition-all duration-300 ease-in-out text-gray-800 text-base resize-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:border-gray-400"
        />
      </div>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, Ref, watch } from 'vue';
import Collapsible from '../utils/Collapsible.vue';
import ResizableTextArea from '../utils/ResizableTextArea.vue';
import type { PromptTemplate } from '../../types/workflow';

const props = defineProps<{ template: PromptTemplate }>();
const emit = defineEmits();

const entirePrompt = ref(props.template.template);
const promptTemplateVariables = computed(() => 
  props.template.variables.filter(variable => variable.source === 'USER_INPUT')
);

// Initialize values with an empty string for 'name'
const values: Ref<{ [key: string]: string }> = reactive({ name: '' });

const updateValue = (key, newValue) => {
  values[key] = newValue;
  emit('update:variable', { variableName: key, value: newValue });
};

// Log the computed promptTemplateVariables for debugging.
watch(promptTemplateVariables, (newVal) => {
  console.log("promptTemplateVariables:", newVal);
});
</script>