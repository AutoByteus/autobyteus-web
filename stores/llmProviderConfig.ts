import { defineStore } from 'pinia'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
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

interface ModelInfo {
  modelIdentifier: string;
  name: string;
  value: string;
  canonicalName: string;
}

interface ProviderWithModels {
  provider: string;
  models: ModelInfo[];
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
      return state.providersWithModels.flatMap(p => p.models.map(m => m.modelIdentifier));
    },
    providersWithModelsForSelection(state): ProviderWithModels[] {
      return state.providersWithModels.filter(p => p.models && p.models.length > 0);
    },
    /**
     * Getter for a sorted list of unique canonical model names, with "default" as the first option.
     */
    canonicalModels(state): string[] {
      const canonicalSet = new Set<string>();
      state.providersWithModels.forEach(provider => {
        provider.models.forEach(model => {
          if (model.canonicalName) {
            canonicalSet.add(model.canonicalName);
          }
        });
      });
      const models = Array.from(canonicalSet).sort();
      // Add 'default' as a special option at the top of the list.
      models.unshift('default');
      return models;
    },
  },
  actions: {
    getProviderForModel(modelIdentifier: string): LLMProvider | null {
      if (!modelIdentifier || !this.providersWithModels) {
        return null;
      }
    
      for (const providerGroup of this.providersWithModels) {
        if (providerGroup.models.some(m => m.modelIdentifier === modelIdentifier)) {
          const providerKey = providerGroup.provider.toUpperCase() as keyof typeof LLMProviderEnum;
          if (Object.values(LLMProviderEnum).includes(providerKey as LLMProvider)) {
            return providerKey as LLMProvider;
          }
        }
      }
      
      return null; // Model not found in any provider list
    },
    
    getModelValue(modelIdentifier: string): string | null {
      for (const providerGroup of this.providersWithModels) {
        const model = providerGroup.models.find(m => m.modelIdentifier === modelIdentifier);
        if (model) {
          return model.value;
        }
      }
      return null;
    },
    
    getModelIdentifierByValue(value: string): string | null {
      for (const providerGroup of this.providersWithModels) {
        const model = providerGroup.models.find(m => m.value === value);
        if (model) {
          return model.modelIdentifier;
        }
      }
      return null;
    },

    async fetchProvidersWithModels() {
      if (this.providersWithModels.length > 0) return; // Guard clause
      this.isLoadingModels = true;
      const { client } = useApolloClient();

      try {
        const { data } = await client.query({
          query: GET_AVAILABLE_LLM_PROVIDERS_WITH_MODELS,
          // Use default 'cache-first' policy
        });

        if (data?.availableLlmProvidersWithModels) {
          this.providersWithModels = data.availableLlmProvidersWithModels;
        } else {
          this.providersWithModels = [];
        }
        return this.providersWithModels;
      } catch (error) {
        console.error('Failed to fetch providers and models:', error);
        this.providersWithModels = [];
        throw error;
      } finally {
        this.isLoadingModels = false;
      }
    },

    async reloadProvidersWithModels() {
      this.isReloadingModels = true;
      const { client } = useApolloClient();

      try {
        const { data } = await client.query({
          query: GET_AVAILABLE_LLM_PROVIDERS_WITH_MODELS,
          fetchPolicy: 'network-only' // Force network fetch, bypassing cache
        });

        if (data?.availableLlmProvidersWithModels) {
          this.providersWithModels = data.availableLlmProvidersWithModels;
        } else {
          this.providersWithModels = [];
        }
        return this.providersWithModels;
      } catch (error) {
        console.error('Failed to reload providers and models:', error);
        this.providersWithModels = [];
        throw error;
      } finally {
        this.isReloadingModels = false;
      }
    },

    async reloadModels() {
      this.isReloadingModels = true;
      const { mutate } = useMutation(RELOAD_LLM_MODELS);
      
      try {
        const result = await mutate();
        const responseMessage = result?.data?.reloadLlmModels;
        
        if (responseMessage && responseMessage.includes("successfully")) {
          // After successful reload, fetch the updated models
          await this.reloadProvidersWithModels();
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
      const { client } = useApolloClient();
      
      try {
        const { data } = await client.query({
          query: GET_LLM_PROVIDER_API_KEY,
          variables: { provider },
        });

        if (data && data.getLlmProviderApiKey) {
          const apiKey = data.getLlmProviderApiKey;
          if (!this.providerConfigs[provider]) {
            this.providerConfigs[provider] = {};
          }
          this.providerConfigs[provider].apiKey = apiKey;
          return apiKey;
        } else {
          if (this.providerConfigs[provider]) {
            delete this.providerConfigs[provider].apiKey;
          }
          return '';
        }
      } catch (error) {
        console.error(`Failed to get provider API key for ${provider}:`, error);
        throw error;
      }
    }
  }
})
