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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';

const props = defineProps<{
  prompt: string
}>();

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void
  (e: 'collapseChanged', value: boolean): void
}>();

const localPrompt = ref(props.prompt);
const isCollapsed = ref(true);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const textareaHeight = ref(0);

const updateHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'; // Reset height to calculate scrollHeight correctly
    textareaHeight.value = textareaRef.value.scrollHeight;
    textareaRef.value.style.height = `${textareaHeight.value}px`; // Set the new height
  }
};

watch(() => props.prompt, (newPrompt) => {
  localPrompt.value = newPrompt;
  updateHeight();
});

const updatePrompt = () => {
  emit('update:prompt', localPrompt.value);
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
  updateHeight();
});

const containerStyle = computed(() => ({
  maxHeight: isCollapsed.value ? '0px' : `${textareaHeight.value}px`,
}));

const textareaStyle = computed(() => ({
  height: `${textareaHeight.value}px`,
  overflowY: 'hidden', // Remove scrollbar by hiding overflow
  transition: 'height 0.3s ease-in-out', // Smooth height transition
}));
</script>

<style scoped>
/* Optional: Enhance transition for max-height */
.transition-max-height {
  transition: max-height 0.3s ease-in-out;
}
</style>
