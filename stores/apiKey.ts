import { defineStore } from 'pinia'
import { SetLLMAPIKey, GetLLMAPIKey } from '~/graphql/mutations/api_key_mutations'

export const useAPIKeyStore = defineStore('apiKey', {
  state: () => ({
    apiKeys: {} as Record<string, string>,
  }),
  actions: {
    async setAPIKey(model: string, apiKey: string) {
      const { $graphql } = useNuxtApp()
      try {
        const result = await $graphql.default.request(SetLLMAPIKey, {
          model,
          apiKey,
        })
        if (result.setLlmApiKey) {
          this.apiKeys[model] = apiKey
        }
        return result.setLlmApiKey
      } catch (error) {
        console.error('Failed to set API key:', error)
        throw error
      }
    },
    async getAPIKey(model: string): Promise<string | undefined> {
      const { $graphql } = useNuxtApp()
      try {
        const result = await $graphql.default.request(GetLLMAPIKey, {
          model,
        })
        const key = result.getLlmApiKey
        if (key && key !== "API key not found for this model.") {
          this.apiKeys[model] = key
        }
        return key
      } catch (error) {
        console.error('Failed to get API key:', error)
        throw error
      }
    },
  },
})