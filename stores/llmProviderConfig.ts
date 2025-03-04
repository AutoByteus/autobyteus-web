import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { 
  GET_LLM_PROVIDER_API_KEY, 
  GET_AVAILABLE_MODELS, 
  GET_AVAILABLE_PROVIDERS 
} from '~/graphql/queries/llm_provider_queries'
import { 
  SET_LLM_PROVIDER_API_KEY,
  RELOAD_LLM_MODELS
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
    isReloadingModels: false,
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

async reloadModels() {
  this.isReloadingModels = true;
  const { mutate } = useMutation(RELOAD_LLM_MODELS);
  
  try {
    const result = await mutate();
    const responseMessage = result?.data?.reloadLlmModels;
    
    // If the response contains a success message
    if (responseMessage && responseMessage.includes("successfully")) {
      // After successful reload, fetch the updated models
      await this.fetchModels();
      return true;
    }
    
    // If the response doesn't indicate success, throw an error with the message
    throw new Error(responseMessage || 'Failed to reload models');
  } catch (error) {
    console.error('Failed to reload models:', error);
    throw error;
  } finally {
    this.isReloadingModels = false;
  }
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
    
    const responseMessage = result?.data?.setLlmProviderApiKey;
    
    // Check if the response contains a success message
    if (responseMessage && responseMessage.includes("successfully")) {
      if (!this.providerConfigs[provider]) {
        this.providerConfigs[provider] = {}
      }
      this.providerConfigs[provider].apiKey = apiKey
      
      // First reload models to force LLMFactory to reinitialize
      await this.reloadModels()
      return true
    }
    
    // If we don't get a success message, throw an error with the response
    throw new Error(responseMessage || 'Failed to set API key');
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
