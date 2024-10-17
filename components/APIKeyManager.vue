<template>
  <div class="api-key-manager p-4 bg-white rounded-lg">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">Manage API Keys</h2>
    <div class="flex flex-col space-y-4">
      <select 
        v-model="selectedModel" 
        class="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
      >
        <option value="" disabled>Select LLM Model</option>
        <option v-for="model in llmModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      <input 
        v-model="apiKey" 
        type="password" 
        placeholder="Enter API Key" 
        class="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
      >
      <div class="flex space-x-2">
        <button 
          @click="saveAPIKey" 
          class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex-grow"
          :disabled="!selectedModel || !apiKey"
        >
          Save API Key
        </button>
        <button 
          @click="getAPIKey" 
          class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex-grow"
          :disabled="!selectedModel"
        >
          Get API Key
        </button>
      </div>
    </div>
    <p v-if="message" :class="{'text-green-500': !error, 'text-red-500': error}" class="mt-2 text-sm">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAPIKeyStore } from '~/stores/apiKey'

const apiKeyStore = useAPIKeyStore()

const llmModels = ['GPT_3_5_TURBO', 'GPT_4', 'CLAUDE_2']
const selectedModel = ref('')
const apiKey = ref('')
const message = ref('')
const error = ref(false)

const saveAPIKey = async () => {
  if (!selectedModel.value || !apiKey.value) return

  try {
    const result = await apiKeyStore.setAPIKey(selectedModel.value, apiKey.value)
    if (result) {
      message.value = 'API key saved successfully'
      error.value = false
      apiKey.value = ''
    } else {
      throw new Error('Failed to save API key')
    }
  } catch (err) {
    message.value = 'Failed to save API key'
    error.value = true
  }

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const getAPIKey = async () => {
  if (!selectedModel.value) return

  try {
    const key = await apiKeyStore.getAPIKey(selectedModel.value)
    if (key && key !== "API key not found for this model.") {
      apiKey.value = key
      message.value = 'API key retrieved successfully'
    } else {
      message.value = 'No API key found for this model'
    }
    error.value = false
  } catch (err) {
    message.value = 'Failed to retrieve API key'
    error.value = true
  }

  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>