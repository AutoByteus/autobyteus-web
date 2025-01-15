<template>
  <div ref="editorContainer" class="monaco-editor-container h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import loader from '@monaco-editor/loader';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'plaintext'
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

const emit = defineEmits(['update:modelValue', 'editorDidMount', 'save']);

const editorContainer = ref<HTMLElement | null>(null);
let editor: any = null;
let monaco: any = null;

const initMonaco = async () => {
  if (!editorContainer.value) return;
  
  monaco = await loader.init();
  
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: false },
    ...props.options
  });

  // Modified save command handler to ensure event emission
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
    () => {
      console.log('Save command triggered in Monaco Editor');
      emit('save');
    }
  );

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue();
    emit('update:modelValue', value);
  });

  emit('editorDidMount', editor);
};

watch(() => props.modelValue, (newValue) => {
  if (editor) {
    const currentValue = editor.getValue();
    if (newValue !== currentValue) {
      const position = editor.getPosition();
      editor.setValue(newValue);
      editor.setPosition(position);
    }
  }
}, { immediate: true });

watch(() => props.language, (newValue) => {
  if (editor && monaco) {
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, newValue);
    }
  }
});

onMounted(async () => {
  await initMonaco();

  // Updated event listener with logging
  if (editorContainer.value) {
    editorContainer.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        console.log('Ctrl+S intercepted');
        e.preventDefault();
        e.stopPropagation();
        emit('save');
      }
    });
  }
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

defineExpose({
  getEditor: () => editor,
  getMonaco: () => monaco
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
