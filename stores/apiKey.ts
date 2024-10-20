// File: autobyteus-web/stores/apiKey.ts

import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { SetLLMAPIKey } from '~/graphql/mutations/api_key_mutations'
import { GetLLMAPIKey } from '~/graphql/queries/api_key_queries'
import type { SetLlmapiKeyMutation, SetLlmapiKeyMutationVariables, GetLlmapiKeyQuery, GetLlmapiKeyQueryVariables } from '~/generated/graphql'

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
        if (result.data?.setLlmApiKey) {
          this.apiKeys[model] = apiKey
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to set API key:', error)
        throw error
      }
    },
    async getAPIKey(model: string): Promise<string | undefined> {
      if (this.apiKeys[model]) {
        return this.apiKeys[model]
      }

      const { onResult, onError } = useQuery<GetLlmapiKeyQuery, GetLlmapiKeyQueryVariables>(GetLLMAPIKey, { model })

      return new Promise((resolve, reject) => {
        onResult((result) => {
          if (result.data) {
            const apiKey = result.data.getLlmApiKey
            if (apiKey) {
              this.apiKeys[model] = apiKey
              resolve(apiKey)
            } else {
              resolve(undefined)
            }
          }
        })

        onError((error) => {
          console.error('Failed to get API key:', error)
          reject(error)
        })
      })
    },
    clearAPIKey(model: string): void {
      delete this.apiKeys[model]
    },
  },
})