<template>
  <textarea
    v-model="localPrompt"
    @input="updatePrompt"
    class="prompt-editor"
    rows="5"
  ></textarea>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  prompt: string
}>()

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void
}>()

const localPrompt = ref(props.prompt)

watch(() => props.prompt, (newPrompt) => {
  localPrompt.value = newPrompt
})

const updatePrompt = () => {
  emit('update:prompt', localPrompt.value)
}
</script>

<style scoped>
.prompt-editor {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}
</style>