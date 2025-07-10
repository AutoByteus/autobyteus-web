import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { 
  GET_LLM_PROVIDER_API_KEY, 
  GET_AVAILABLE_LLM_PROVIDERS_WITH_MODELS
} from '~/graphql/queries/llm_provider_queries'
import { 
  SET_LLM_PROVIDER_API_KEY,
  RELOAD_LLM_MODELS
} from '~/graphql/mutations/llm_provider_mutations'
import type { LLMProvider } from '~/types/llm'
import { LLMProvider as LLMProviderEnum } from '~/types/llm'

interface LLMProviderConfig {
  apiKey?: string
}

interface ProviderWithModels {
  provider: string
  models: string[]
}

export const useLLMProviderConfigStore = defineStore('llmProviderConfig', {
  state: () => ({
    providersWithModels: [] as ProviderWithModels[],
    providerConfigs: {} as Record<string, LLMProviderConfig>,
    isLoadingModels: false,
    isReloadingModels: false,
  }),
  getters: {
    providers(state): string[] {
      return state.providersWithModels.map(p => p.provider);
    },
    models(state): string[] {
      return state.providersWithModels.flatMap(p => p.models);
    }
  },
  actions: {
    getProviderForModel(modelName: string): LLMProvider | null {
      if (!modelName || !this.providersWithModels) {
        return null;
      }
    
      for (const providerGroup of this.providersWithModels) {
        if (providerGroup.models.includes(modelName)) {
          const providerKey = providerGroup.provider.toUpperCase() as keyof typeof LLMProviderEnum;
          if (Object.values(LLMProviderEnum).includes(providerKey as LLMProvider)) {
            return providerKey as LLMProvider;
          }
        }
      }
      
      return null; // Model not found in any provider list
    },

    async fetchProvidersWithModels() {
      this.isLoadingModels = true;
      const { onResult, onError } = useQuery(GET_AVAILABLE_LLM_PROVIDERS_WITH_MODELS, null, {
        fetchPolicy: 'network-only' // Force network fetch, bypassing cache
      });

      return new Promise((resolve, reject) => {
        onResult(({ data }) => {
          this.isLoadingModels = false;
          if (data?.availableLlmProvidersWithModels) {
            this.providersWithModels = data.availableLlmProvidersWithModels;
            resolve(this.providersWithModels);
          } else {
            this.providersWithModels = [];
            resolve([]);
          }
        });
        
        onError((error) => {
          this.isLoadingModels = false;
          console.error('Failed to fetch providers and models:', error);
          this.providersWithModels = [];
          reject(error);
        });
      });
    },

    async reloadModels() {
      this.isReloadingModels = true;
      const { mutate } = useMutation(RELOAD_LLM_MODELS);
      
      try {
        const result = await mutate();
        const responseMessage = result?.data?.reloadLlmModels;
        
        if (responseMessage && responseMessage.includes("successfully")) {
          // After successful reload, fetch the updated models
          await this.fetchProvidersWithModels();
          return true;
        }
        
        throw new Error(responseMessage || 'Failed to reload models');
      } catch (error) {
        console.error('Failed to reload models:', error);
        throw error;
      } finally {
        this.isReloadingModels = false;
      }
    },

    async setLLMProviderApiKey(provider: string, apiKey: string) {
      const { mutate } = useMutation(SET_LLM_PROVIDER_API_KEY)
      
      try {
        const result = await mutate({
          provider,
          apiKey,
        })
        
        const responseMessage = result?.data?.setLlmProviderApiKey;
        
        if (responseMessage && responseMessage.includes("successfully")) {
          if (!this.providerConfigs[provider]) {
            this.providerConfigs[provider] = {}
          }
          this.providerConfigs[provider].apiKey = apiKey
          
          await this.reloadModels()
          return true
        }
        
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
            if (this.providerConfigs[provider]) {
              delete this.providerConfigs[provider].apiKey
            }
            resolve('')
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
