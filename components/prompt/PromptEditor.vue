<template>
  <div class="flex flex-col">
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-lg font-medium text-gray-700">Edit Prompt</h4>
      <button 
        @click="toggleCollapse" 
        class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm"
      >
        {{ isCollapsed ? 'Expand' : 'Collapse' }}
      </button>
    </div>
    <div 
      class="collapsible-content"
      :class="{ 'collapsed': isCollapsed }"
    >
      <textarea
        v-model="localPrompt"
        @input="updatePrompt"
        class="w-full p-2 border rounded resize-none"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  prompt: string
}>();

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void
}>();

const localPrompt = ref(props.prompt);
const isCollapsed = ref(true);

watch(() => props.prompt, (newPrompt) => {
  localPrompt.value = newPrompt;
});

const updatePrompt = () => {
  emit('update:prompt', localPrompt.value);
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.collapsible-content {
  max-height: 1000px; /* Adjust this value based on your needs */
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  opacity: 1;
  overflow: hidden;
}

.collapsible-content.collapsed {
  max-height: 0;
  opacity: 0;
}

textarea {
  transition: height 0.3s ease-in-out;
  min-height: 100px; /* Adjust this value based on your needs */
  height: auto;
  overflow-y: hidden;
}
</style>