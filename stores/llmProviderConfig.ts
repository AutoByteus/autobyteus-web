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
    models: [] as string[],
    providerConfigs: {} as Record<string, LLMProviderConfig>,
  }),
  
  actions: {
    async fetchProviders() {
      const { onResult, onError } = useQuery(GET_AVAILABLE_PROVIDERS)
      
      return new Promise((resolve, reject) => {
        onResult(({ data }) => {
          if (data?.availableProviders) {
            this.providers = data.availableProviders
            resolve(data.availableProviders)
          }
        })
        
        onError((error) => {
          console.error('Failed to fetch providers:', error)
          reject(error)
        })
      })
    },
    
    async fetchModels() {
      const { onResult, onError } = useQuery(GET_AVAILABLE_MODELS)
      
      return new Promise((resolve, reject) => {
        onResult(({ data }) => {
          if (data?.availableModels) {
            this.models = data.availableModels
            resolve(data.availableModels)
          }
        })
        
        onError((error) => {
          console.error('Failed to fetch models:', error)
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
        
        if (result.data?.setLlmProviderApiKey) {
          if (!this.providerConfigs[provider]) {
            this.providerConfigs[provider] = {}
          }
          this.providerConfigs[provider].apiKey = apiKey
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
          if (data) {
            const apiKey = data.getLlmProviderApiKey
            if (!this.providerConfigs[provider]) {
              this.providerConfigs[provider] = {}
            }
            this.providerConfigs[provider].apiKey = apiKey
            resolve(apiKey)
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