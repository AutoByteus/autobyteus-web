import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { SetLLMAPIKey } from '~/graphql/mutations/api_key_mutations'
import type { SetLlmapiKeyMutation, SetLlmapiKeyMutationVariables } from '~/generated/graphql'

export const useAPIKeyStore = defineStore('apiKey', {
  state: () => ({
    apiKeys: {} as Record<string, string>,
  }),
  actions: {
    async setAPIKey(model: string, apiKey: string): Promise<boolean> {
      const { mutate: setLlmApiKeyMutation } = useMutation<SetLlmapiKeyMutation, SetLlmapiKeyMutationVariables>(SetLLMAPIKey)
      try {
        const result = await setLlmApiKeyMutation({
          model,
          apiKey,
        })
        if (result?.data?.setLlmApiKey) {
          this.apiKeys[model] = apiKey
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to set API key:', error)
        throw error
      }
    },
    getAPIKey(model: string): string | undefined {
      return this.apiKeys[model]
    },
    clearAPIKey(model: string): void {
      delete this.apiKeys[model]
    },
  },
})