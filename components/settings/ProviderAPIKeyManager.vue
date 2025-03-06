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

        <!-- Available Models Section -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <h3 class="text-lg font-medium text-gray-800">Available Models</h3>
              <button 
                @click="refreshModels" 
                class="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200"
                title="Refresh models"
                :disabled="isLoadingModels || isReloadingModels"
              >
                <span class="i-heroicons-arrow-path-20-solid w-5 h-5" 
                      :class="{ 'animate-spin': isLoadingModels || isReloadingModels }"></span>
              </button>
            </div>
            <button
              @click="refreshModels"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoadingModels || isReloadingModels"
            >
              <span v-if="isLoadingModels || isReloadingModels" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {{ isLoadingModels || isReloadingModels ? 'Reloading...' : 'Reload Models' }}
            </button>
          </div>

          <div v-if="isLoadingModels || isReloadingModels" class="flex justify-center items-center py-6">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <p class="text-gray-600">
              {{ isReloadingModels ? 'Reloading and discovering models...' : 'Loading available models...' }}
            </p>
          </div>
          <div v-else-if="availableModels.length === 0" class="bg-gray-50 rounded-lg p-6 text-center">
            <span class="i-heroicons-cube-transparent-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
            <p class="text-gray-600">No models available. Configure at least one provider API key to see available models.</p>
          </div>
          <div v-else class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div 
              v-for="model in availableModels" 
              :key="model"
              class="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center"
            >
              <span class="i-heroicons-cube-20-solid w-4 h-4 text-blue-600 mr-2"></span>
              <span class="text-sm font-medium text-gray-800 truncate">{{ model }}</span>
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
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig'

const store = useLLMProviderConfigStore()
// Use storeToRefs for reactive state properties
const { isLoadingModels, models, isReloadingModels } = storeToRefs(store)

const loading = ref(true)
const saving = ref(false)
const providers = ref<string[]>([])
const selectedProvider = ref('')
const apiKey = ref('')
const showApiKey = ref(false)
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const providerConfigs = ref<Record<string, { apiKey?: string }>>({})

// Computed property to ensure models is always an array
const availableModels = computed(() => models.value || [])

const refreshModels = async () => {
  try {
    // Call reloadModels to force backend to rediscover models first
    await store.reloadModels()
    showNotification('Models reloaded and refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to reload models:', error)
    showNotification('Failed to reload models', 'error')
  }
}

onMounted(async () => {
  try {
    providers.value = await store.fetchProviders()
    
    // Load existing configurations
    for (const provider of providers.value) {
      try {
        const apiKey = await store.getLLMProviderApiKey(provider)
        // Check specifically for non-empty strings to determine if configured
        if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
          providerConfigs.value[provider] = { apiKey: '********' }
        } else {
          // Ensure provider exists in providerConfigs but without apiKey property
          providerConfigs.value[provider] = {}
        }
      } catch (error) {
        console.error(`Failed to load API key for ${provider}:`, error)
        // Ensure provider exists in providerConfigs but without apiKey property
        providerConfigs.value[provider] = {}
      }
    }
    
    // Load available models
    await store.fetchModels()
  } catch (error) {
    console.error('Failed to load providers or models:', error)
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
    
    showNotification(`API key for ${selectedProvider.value} saved and models reloaded successfully`, 'success')
    apiKey.value = ''
    selectedProvider.value = ''
  } catch (error) {
    console.error('Failed to save API key or reload models:', error)
    showNotification(`Failed to save API key for ${selectedProvider.value}`, 'error')
  } finally {
    saving.value = false
  }
}
</script>
