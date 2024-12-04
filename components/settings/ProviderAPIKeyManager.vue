<template>
  <div class="provider-api-key-manager bg-white rounded-lg shadow-lg">
    <div class="p-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">API Key Management</h2>
      
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Provider Selection -->
        <div class="provider-selector">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
          <select 
            v-model="selectedProvider"
            class="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a provider</option>
            <option v-for="provider in providers" :key="provider" :value="provider">
              {{ provider }}
            </option>
          </select>
        </div>

        <!-- API Key Input -->
        <div v-if="selectedProvider" class="api-key-input">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ selectedProvider }} API Key
          </label>
          <div class="relative">
            <input
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              class="w-full p-2.5 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :placeholder="`Enter ${selectedProvider} API Key`"
            >
            <button
              @click="toggleApiKeyVisibility"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <span v-if="showApiKey" class="i-heroicons-eye-slash-20-solid w-5 h-5"></span>
              <span v-else class="i-heroicons-eye-20-solid w-5 h-5"></span>
            </button>
          </div>
        </div>

        <!-- Save Button -->
        <div v-if="selectedProvider" class="flex justify-end">
          <button
            @click="saveApiKey"
            :disabled="!apiKey || saving"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ saving ? 'Saving...' : 'Save API Key' }}
          </button>
        </div>

        <!-- Provider Status List -->
        <div class="mt-8">
          <h3 class="text-lg font-medium text-gray-800 mb-4">Provider Status</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div
              v-for="provider in providers"
              :key="provider"
              class="p-4 rounded-lg border"
              :class="providerConfigs[provider]?.apiKey ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <span 
                    class="w-2 h-2 rounded-full mr-2"
                    :class="providerConfigs[provider]?.apiKey ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  <span class="font-medium">{{ provider }}</span>
                </div>
                <span 
                  class="text-sm"
                  :class="providerConfigs[provider]?.apiKey ? 'text-green-600' : 'text-gray-500'"
                >
                  {{ providerConfigs[provider]?.apiKey ? 'Configured' : 'Not Configured' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div
        v-if="notification"
        class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg"
        :class="notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig'

const store = useLLMProviderConfigStore()

const loading = ref(true)
const saving = ref(false)
const providers = ref<string[]>([])
const selectedProvider = ref('')
const apiKey = ref('')
const showApiKey = ref(false)
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const providerConfigs = ref<Record<string, { apiKey?: string }>>({})

onMounted(async () => {
  try {
    providers.value = await store.fetchProviders()
    
    // Load existing configurations
    for (const provider of providers.value) {
      try {
        const apiKey = await store.getLLMProviderApiKey(provider)
        if (apiKey) {
          providerConfigs.value[provider] = { apiKey: '********' }
        }
      } catch (error) {
        console.error(`Failed to load API key for ${provider}:`, error)
      }
    }
  } catch (error) {
    showNotification('Failed to load providers', 'error')
  } finally {
    loading.value = false
  }
})

const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value
}

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const saveApiKey = async () => {
  if (!selectedProvider.value || !apiKey.value) return

  saving.value = true
  try {
    await store.setLLMProviderApiKey(selectedProvider.value, apiKey.value)
    providerConfigs.value[selectedProvider.value] = { apiKey: '********' }
    showNotification(`API key for ${selectedProvider.value} saved successfully`, 'success')
    apiKey.value = ''
    selectedProvider.value = ''
  } catch (error) {
    showNotification(`Failed to save API key for ${selectedProvider.value}`, 'error')
  } finally {
    saving.value = false
  }
}
</script>