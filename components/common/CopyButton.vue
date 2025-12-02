<template>
  <button
    @click="copy"
    :title="tooltipText"
    class="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
  >
    <ClipboardDocumentCheckIcon v-if="copied" class="w-5 h-5 text-green-500" />
    <ClipboardDocumentIcon v-else class="w-5 h-5" />
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  textToCopy: string;
  label?: string; // Optional custom label for the tooltip
}>();

const copied = ref(false);

// Use the provided label or fallback to 'Copy source code'
const tooltipText = computed(() => copied.value ? 'Copied!' : (props.label || 'Copy source code'));

const copy = async () => {
  if (!props.textToCopy) return;
  try {
    await navigator.clipboard.writeText(props.textToCopy);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>
