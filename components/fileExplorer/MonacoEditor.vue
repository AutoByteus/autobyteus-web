
<template>
  <div ref="editorContainer" class="h-full w-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { getLanguage } from '~/utils/aiResponseParser/languageDetector'

const props = defineProps<{
  modelValue: string
  filePath: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  if (editorContainer.value) {
    const language = getLanguage(props.filePath)
    
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language,
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      tabSize: 2,
    })

    editor.onDidChangeModelContent(() => {
      emit('update:modelValue', editor?.getValue() || '')
    })
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>
