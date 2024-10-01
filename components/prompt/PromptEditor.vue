<template>
  <div class="flex flex-col">
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-lg font-medium text-gray-700">Edit Prompt</h4>
      <div class="flex items-center">
        <select 
          v-model="selectedModel" 
          class="mr-2 border rounded p-1"
          @change="onModelChange"
        >
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
        <button 
          @click="toggleCollapse" 
          class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm"
        >
          {{ isCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>
    </div>
    <div 
      v-if="selectedTemplate"
      class="transition-max-height duration-300 ease-in-out overflow-hidden"
      :style="containerStyle"
    >
      <textarea
        ref="textareaRef"
        v-model="localPrompt"
        @input="updatePrompt"
        class="w-full p-2 border rounded resize-none transition-all duration-300 ease-in-out"
        :style="textareaStyle"
      ></textarea>
    </div>
    <p v-else class="text-gray-500">No prompt template available for this model.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { PromptTemplate } from '~/types/workflow';
import { useWorkflowStore } from '~/stores/workflow'

const workflowStore = useWorkflowStore()

const props = defineProps<{
  promptTemplates: Record<string, PromptTemplate>
  stepId: string
}>();

const emit = defineEmits<{
  (e: 'collapseChanged', value: boolean): void
}>();

const availableModels = computed(() => Object.keys(props.promptTemplates));
const selectedModel = ref('');
const selectedTemplate = computed(() => props.promptTemplates[selectedModel.value]);

const localPrompt = ref('');
const isCollapsed = ref(true);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const textareaHeight = ref(0);

const updateHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaHeight.value = textareaRef.value.scrollHeight;
    textareaRef.value.style.height = `${textareaHeight.value}px`;
  }
};

watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    localPrompt.value = newTemplate.template;
    updateHeight();
  }
});

const onModelChange = () => {
  if (selectedTemplate.value) {
    localPrompt.value = selectedTemplate.value.template;
    updatePrompt();
    updateHeight();
  }
};

const updatePrompt = () => {
  workflowStore.updateStepPrompt({
    stepId: props.stepId,
    modelName: selectedModel.value,
    newPrompt: localPrompt.value
  })
  updateHeight();
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapseChanged', isCollapsed.value);
  if (!isCollapsed.value) {
    updateHeight();
  }
};

onMounted(() => {
  if (availableModels.value.length > 0) {
    selectedModel.value = availableModels.value[0];
    onModelChange();
  }
  updateHeight();
});

const containerStyle = computed(() => ({
  maxHeight: isCollapsed.value ? '0px' : `${textareaHeight.value}px`,
}));

const textareaStyle = computed(() => ({
  height: `${textareaHeight.value}px`,
  overflowY: 'hidden',
  transition: 'height 0.3s ease-in-out',
}));
</script>

<style scoped>
.transition-max-height {
  transition: max-height 0.3s ease-in-out;
}
</style>