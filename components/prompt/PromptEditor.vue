<template>
  <div class="relative">
    <textarea
      ref="textareaRef"
      v-model="localPrompt"
      @input="updatePromptAndResize"
      :class="textareaClasses"
      :style="textareaStyle"
      rows="5"
    ></textarea>
    <button
      @click="toggleExpand"
      class="absolute bottom-2 right-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        class="w-4 h-4 group-hover:text-gray-700"
        :class="{ 'rotate-180': isExpanded }"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'

const props = defineProps<{
  prompt: string
}>()

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void
}>()

const localPrompt = ref(props.prompt)
const isExpanded = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref('80px') // Default height

watch(() => props.prompt, (newPrompt) => {
  localPrompt.value = newPrompt
  nextTick(() => {
    if (isExpanded.value) {
      adjustTextareaHeight()
    }
  })
})

const updatePromptAndResize = () => {
  emit('update:prompt', localPrompt.value)
  if (isExpanded.value) {
    adjustTextareaHeight()
  }
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  nextTick(() => {
    if (isExpanded.value) {
      adjustTextareaHeight()
    } else {
      textareaHeight.value = '80px'
    }
  })
}

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    textareaHeight.value = `${textareaRef.value.scrollHeight}px`
  }
}

const textareaClasses = computed(() => {
  return [
    'w-full p-2 border border-gray-300 rounded-md font-mono text-sm transition-all duration-300 ease-in-out resize-none',
    isExpanded.value ? 'overflow-hidden' : 'overflow-hidden h-20'
  ]
})

const textareaStyle = computed(() => {
  return isExpanded.value ? { height: textareaHeight.value } : {}
})

onMounted(() => {
  adjustTextareaHeight()
})
</script>