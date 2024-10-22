<template>
  <div class="relative inline-block w-64">
    <button
      @click="toggleDropdown"
      class="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {{ selectedModel || 'Select a model' }}
    </button>
    <div
      v-if="isOpen"
      class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div v-for="(models, group) in groupedModels" :key="group">
        <div class="px-4 py-2 text-sm font-semibold bg-gray-100">{{ group }}</div>
        <button
          v-for="model in models"
          :key="model"
          @click="selectModel(model)"
          class="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
        >
          {{ model }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LlmModel } from '~/generated/graphql'

const props = defineProps<{
  modelValue: LlmModel
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: LlmModel): void
}>()

const isOpen = ref(false)
const selectedModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as LlmModel)
})

const groupedModels = computed(() => {
  const groups: Record<string, LlmModel[]> = {
    'OpenAI': [],
    'Mistral': [],
    'Groq': [],
    'Gemini': [],
    'Claude': [],
    'Perplexity': [],
    'Other': []
  }

  Object.values(LlmModel).forEach(model => {
    const group = Object.keys(groups).find(g => model.startsWith(g.toUpperCase())) || 'Other'
    groups[group].push(model)
  })

  return groups
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectModel = (model: LlmModel) => {
  selectedModel.value = model
  isOpen.value = false
}
</script>