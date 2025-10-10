<template>
  <div>
    <textarea
      :value="modelValue"
      @input="onInput"
      ref="textareaRef"
      class="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
      style="height: 150px;"
      placeholder="Enter your math problem here."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
// This component is now simplified to only handle text input.
defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}
</script>
