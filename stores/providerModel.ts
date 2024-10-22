// File: autobyteus-web/stores/providerModel.ts

import { defineStore } from 'pinia'
import { useQuery } from '@vue/apollo-composable'
import { GetProviderModels } from '~/graphql/queries/provider_model_queries'
import type { GetProviderModelsQuery } from '~/generated/graphql'

interface ProviderModel {
  name: string
  value: string
}

interface ProviderModels {
  provider: string
  models: ProviderModel[]
}

export const useProviderModelStore = defineStore('providerModel', {
  state: () => ({
    providerModels: [] as ProviderModels[],
  }),
  actions: {
    async fetchProviderModels(): Promise<void> {
      const { onResult, onError } = useQuery<GetProviderModelsQuery>(GetProviderModels)

      return new Promise((resolve, reject) => {
        onResult((result) => {
          if (result.data) {
            this.providerModels = result.data.getModelsByProvider
            resolve()
          }
        })

        onError((error) => {
          console.error('Failed to fetch provider models:', error)
          reject(error)
        })
      })
    },
    getModelsByProvider(provider: string): ProviderModel[] {
      const providerData = this.providerModels.find(pm => pm.provider === provider)
      return providerData ? providerData.models : []
    },
  },
  getters: {
    allProviders(): string[] {
      return this.providerModels.map(pm => pm.provider)
    },
  },
})