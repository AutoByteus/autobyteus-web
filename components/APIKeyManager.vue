<template>
  <div class="api-key-manager p-4 bg-white rounded-lg max-h-[80vh] overflow-y-auto">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">Manage API Keys</h2>
    <div class="flex flex-col space-y-4">
      <div v-for="(model, index) in llmModels" :key="index" class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input 
          v-model="apiKeys[model]" 
          type="password" 
          :placeholder="`Enter ${model} API Key`" 
          class="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700 flex-grow"
        >
        <button 
          @click="saveAPIKey(model)"
          class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto"
          :disabled="!apiKeys[model]"
        >
          Set API Key
        </button>
      </div>
    </div>
    <p v-if="message" :class="{'text-green-500': !error, 'text-red-500': error}" class="mt-2 text-sm">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAPIKeyStore } from '~/stores/apiKey'

const apiKeyStore = useAPIKeyStore()

const llmModels = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'MISTRAL_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'GEMINI_API_KEY',
  'NVIDIA_API_KEY'
]

const apiKeys = reactive(Object.fromEntries(llmModels.map(model => [model, ''])))
const message = ref('')
const error = ref(false)

const saveAPIKey = async (model: string) => {
  if (!apiKeys[model]) return

  try {
    const result = apiKeyStore.setAPIKey(model, apiKeys[model])
    if (result) {
      message.value = `API key for ${model} saved successfully`
      error.value = false
      apiKeys[model] = ''
    } else {
      throw new Error(`Failed to save API key for ${model}`)
    }
  } catch (err) {
    message.value = `Failed to save API key for ${model}`
    error.value = true
    console.error(err)
  }

  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>
