
<template>
  <div ref="editorContainer" class="monaco-editor-container h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import loader from '@monaco-editor/loader';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'plaintext'
  },
  height: {
    type: String,
    default: '100%'
  },
  theme: {
    type: String,
    default: 'vs'
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'editorDidMount']);

const editorContainer = ref<HTMLElement | null>(null);
let editor: any = null;

const initMonaco = async () => {
  if (!editorContainer.value) return;
  
  const monaco = await loader.init();
  
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: false },
    ...props.options
  });

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue());
  });

  emit('editorDidMount', editor);
};

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
}, { deep: true });

watch(() => props.language, (newValue) => {
  if (editor) {
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, newValue);
    }
  }
});

onMounted(async () => {
  await initMonaco();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

defineExpose({
  getEditor: () => editor
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  min-height: 300px;
  border-radius: 0.375rem;
  overflow: hidden;
}
</style>
