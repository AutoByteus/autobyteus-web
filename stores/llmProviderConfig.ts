import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { 
  GET_LLM_PROVIDER_API_KEY, 
  GET_AVAILABLE_MODELS, 
  GET_AVAILABLE_PROVIDERS 
} from '~/graphql/queries/llm_provider_queries'
import { 
  SET_LLM_PROVIDER_API_KEY 
} from '~/graphql/mutations/llm_provider_mutations'

interface LLMProviderConfig {
  apiKey?: string
}
export const useLLMProviderConfigStore = defineStore('llmProviderConfig', {
  state: () => ({
    providers: [] as string[],
    models: [] as string[], // Ensure this is initialized as an empty array
    providerConfigs: {} as Record<string, LLMProviderConfig>,
    isLoadingModels: false,
  }),
  actions: {
    async fetchProviders() {
      const { onResult, onError } = useQuery(GET_AVAILABLE_PROVIDERS, null, {
        fetchPolicy: 'network-only' // Force network fetch, bypassing cache
      })
  return new Promise((resolve, reject) => {
    onResult(({ data }) => {
      if (data?.availableProviders) {
        this.providers = data.availableProviders
        resolve(data.availableProviders)
      } else {
        this.providers = []
        resolve([])
      }
    })
    
    onError((error) => {
      console.error('Failed to fetch providers:', error)
      this.providers = []
      reject(error)
    })
  })
},

async fetchModels() {
  this.isLoadingModels = true;
  const { onResult, onError } = useQuery(GET_AVAILABLE_MODELS, null, {
    fetchPolicy: 'network-only' // Force network fetch, bypassing cache
  })
  
  return new Promise((resolve, reject) => {
    onResult(({ data }) => {
      this.isLoadingModels = false;
      if (data?.availableModels) {
        this.models = data.availableModels
        resolve(data.availableModels)
      } else {
        this.models = []
        resolve([])
      }
    })
    
    onError((error) => {
      this.isLoadingModels = false;
      console.error('Failed to fetch models:', error)
      this.models = []
      reject(error)
    })
  })
},

async setLLMProviderApiKey(provider: string, apiKey: string) {
  const { mutate } = useMutation(SET_LLM_PROVIDER_API_KEY)
  
  try {
    const result = await mutate({
      provider,
      apiKey,
    })
    
    if (result?.data?.setLlmProviderApiKey) {
      if (!this.providerConfigs[provider]) {
        this.providerConfigs[provider] = {}
      }
      this.providerConfigs[provider].apiKey = apiKey
      
      // Refresh the models list after setting a new API key
      await this.fetchModels()
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to set provider API key:', error)
    throw error
  }
},

async getLLMProviderApiKey(provider: string) {
  const { onResult, onError } = useQuery(GET_LLM_PROVIDER_API_KEY, {
    provider,
  })
  
  return new Promise((resolve, reject) => {
    onResult(({ data }) => {
      if (data && data.getLlmProviderApiKey) {
        const apiKey = data.getLlmProviderApiKey
        if (!this.providerConfigs[provider]) {
          this.providerConfigs[provider] = {}
        }
        this.providerConfigs[provider].apiKey = apiKey
        resolve(apiKey)
      } else {
        // Don't set apiKey property if not available
        if (this.providerConfigs[provider]) {
          delete this.providerConfigs[provider].apiKey
        }
        resolve('')  // Return empty string for consistency
      }
    })
    
    onError((error) => {
      console.error('Failed to get provider API key:', error)
      reject(error)
    })
  })
}
  }
})
