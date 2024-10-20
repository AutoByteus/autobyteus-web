<template>
  <div class="api-key-manager p-4 bg-white rounded-lg shadow-lg max-w-md w-full mx-auto">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">Manage API Keys</h2>
    
    <div class="mb-4">
      <div class="flex space-x-4 mb-4">
        <button 
          @click="activeTab = 'set'"
          :class="{'bg-blue-600 text-white': activeTab === 'set', 'bg-gray-200 text-gray-700': activeTab !== 'set'}"
          class="flex-1 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
        >
          Set API Key
        </button>
        <button 
          @click="activeTab = 'view'"
          :class="{'bg-blue-600 text-white': activeTab === 'view', 'bg-gray-200 text-gray-700': activeTab !== 'view'}"
          class="flex-1 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
        >
          View Saved Keys
        </button>
      </div>

      <div v-if="activeTab === 'set'">
        <div class="mb-4">
          <label for="apiKeyType" class="block text-sm font-medium text-gray-700 mb-1">API Key Type</label>
          <select 
            id="apiKeyType"
            v-model="selectedModel" 
            class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="" disabled>Select API Key Type</option>
            <option v-for="model in llmModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </div>
        
        <div class="mb-4">
          <label for="apiKeyInput" class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input 
            id="apiKeyInput"
            v-model="currentApiKey" 
            type="password" 
            :placeholder="selectedModel ? `Enter ${selectedModel} API Key` : 'Select an API Key Type first'"
            class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
            :disabled="!selectedModel"
          >
        </div>

        <button 
          @click="saveAPIKey"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
          :disabled="!selectedModel || !currentApiKey"
        >
          Set API Key
        </button>
      </div>

      <div v-if="activeTab === 'view'">
        <ul class="space-y-2">
          <li v-for="model in llmModels" :key="model" 
              class="flex justify-between items-center p-2 rounded-md border"
              :class="{'border-green-500 bg-green-50': apiKeys[model], 'border-gray-300 bg-gray-50': !apiKeys[model]}">
            <span class="text-sm font-medium text-gray-700" :title="getAPIKeyDescription(model)">{{ model }}</span>
            <span v-if="apiKeys[model]" class="text-green-600 text-sm font-medium">Set</span>
            <span v-else class="text-gray-500 text-sm font-medium">Not Set</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="flex justify-end">
      <button @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm font-medium">
        Close
      </button>
    </div>

    <p v-if="message" :class="{'text-green-600': !error, 'text-red-600': error}" class="mt-2 text-sm text-center font-medium">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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

const apiKeys = reactive(Object.fromEntries(llmModels.map(model => [model, false])))
const message = ref('')
const error = ref(false)
const selectedModel = ref('')
const currentApiKey = ref('')
const activeTab = ref('set')

onMounted(async () => {
  for (const model of llmModels) {
    try {
      const key = await apiKeyStore.getAPIKey(model)
      apiKeys[model] = !!key
    } catch (err) {
      console.error(`Failed to fetch API key for ${model}:`, err)
    }
  }
})

const saveAPIKey = async () => {
  if (!selectedModel.value || !currentApiKey.value) return

  try {
    const result = await apiKeyStore.setAPIKey(selectedModel.value, currentApiKey.value)
    if (result) {
      message.value = `API key for ${selectedModel.value} saved successfully`
      error.value = false
      apiKeys[selectedModel.value] = true
      currentApiKey.value = ''
      selectedModel.value = ''
    } else {
      throw new Error(`Failed to save API key for ${selectedModel.value}`)
    }
  } catch (err) {
    message.value = `Failed to save API key for ${selectedModel.value}`
    error.value = true
    console.error(err)
  }

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const getAPIKeyDescription = (model: string) => {
  const descriptions: {[key: string]: string} = {
    'OPENAI_API_KEY': 'API key for OpenAI services',
    'ANTHROPIC_API_KEY': 'API key for Anthropic AI services',
    'MISTRAL_API_KEY': 'API key for Mistral AI services',
    'AWS_ACCESS_KEY_ID': 'Access key ID for Amazon Web Services',
    'AWS_SECRET_ACCESS_KEY': 'Secret access key for Amazon Web Services',
    'GEMINI_API_KEY': 'API key for Google Gemini AI services',
    'NVIDIA_API_KEY': 'API key for NVIDIA AI services'
  }
  return descriptions[model] || 'API key for AI services'
}

defineEmits(['close'])
</script>