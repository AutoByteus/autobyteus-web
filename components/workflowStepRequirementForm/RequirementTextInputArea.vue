<template>
  <div class="relative w-full">
    <textarea
      v-model="localRequirement"
      ref="textarea"
      class="w-full p-4 pr-32 min-h-[100px] max-h-[200px] border-0 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto bg-white transition-all duration-300"
      :style="{ height: textareaHeight + 'px' }"
      placeholder="Enter your requirement here..."
      @input="adjustTextareaHeight"
      @keydown="handleKeyDown"
    ></textarea>
    
    <div class="absolute bottom-4 right-4 flex items-center space-x-2">
      <GroupedModelSelect
        v-if="isFirstMessage"
        v-model="localSelectedModel"
        class="min-w-[180px]"
        @update:modelValue="updateModel"
      />
      <button 
        @click="send"
        :disabled="isSending || !localRequirement.trim()"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <svg v-if="isSending" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
        </svg>
        {{ isSending ? 'Sending...' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import GroupedModelSelect from '~/components/workflow/GroupedModelSelect.vue'
import { LlmModel } from '~/generated/graphql'

const props = defineProps({
  isFirstMessage: {
    type: Boolean,
    required: true
  },
  isSending: {
    type: Boolean,
    required: true
  },
  selectedModel: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['send', 'update-model'])

const localRequirement = ref('')
const localSelectedModel = ref(props.selectedModel)
const textarea = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref(100)

watch(() => props.selectedModel, (newVal) => {
  localSelectedModel.value = newVal
})

const updateModel = (newModel: LlmModel) => {
  localSelectedModel.value = newModel
  emit('update-model', newModel)
}

const send = () => {
  emit('send', localRequirement.value, props.isFirstMessage ? localSelectedModel.value : undefined)
  localRequirement.value = ''
  adjustTextareaHeight()
}

const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${textarea.value.scrollHeight}px`
    textareaHeight.value = textarea.value.scrollHeight
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    send()
  }
}

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>