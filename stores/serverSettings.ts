import { defineStore } from 'pinia'
import { getApolloClient } from '~/utils/apolloClient'
import { GET_SERVER_SETTINGS } from '~/graphql/queries/server_settings_queries'
import { UPDATE_SERVER_SETTING } from '~/graphql/mutations/server_settings_mutations'

export interface ServerSetting {
  key: string
  value: string
  description: string
}

export const useServerSettingsStore = defineStore('serverSettings', {
  state: () => ({
    settings: [] as ServerSetting[],
    isLoading: false,
    error: null as string | null,
    isUpdating: false
  }),
  getters: {
    getSettingByKey: (state) => (key: string) => {
      return state.settings.find((setting) => setting.key === key)
    }
  },
  actions: {
    async fetchServerSettings() {
      if (this.settings.length > 0) return this.settings

      this.isLoading = true
      this.error = null

      const client = getApolloClient()
      try {
        const { data } = await client.query({
          query: GET_SERVER_SETTINGS
        })

        this.settings = data?.getServerSettings ?? []
        return this.settings
      } catch (error: any) {
        this.error = error.message ?? 'Failed to fetch server settings'
        console.error('Failed to fetch server settings:', error)
        this.settings = []
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async reloadServerSettings() {
      this.isLoading = true;
      this.error = null;

      const client = getApolloClient()

      try {
        const { data } = await client.query({
          query: GET_SERVER_SETTINGS,
          fetchPolicy: 'network-only' // Force network fetch, bypassing cache
        });

        this.settings = data?.getServerSettings ?? [];
        return this.settings;
      } catch (error: any) {
        this.error = error.message ?? 'Failed to reload server settings';
        console.error('Failed to reload server settings:', error);
        this.settings = [];
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateServerSetting(key: string, value: string) {
      this.isUpdating = true
      this.error = null
      
      const client = getApolloClient()
      try {
        const { data, errors } = await client.mutate({
          mutation: UPDATE_SERVER_SETTING,
          variables: { key, value }
        })
        
        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '))
        }
        
        const responseMessage = data?.updateServerSetting
        
        if (responseMessage && responseMessage.includes("successfully")) {
          // Reload settings from server to ensure state is consistent
          await this.reloadServerSettings();
          return true
        }
        
        this.error = responseMessage || 'Failed to update server setting'
        throw new Error(responseMessage || 'Failed to update server setting')
      } catch (error: any) {
        this.error = error.message
        console.error(`Failed to update server setting ${key}:`, error)
        throw error
      } finally {
        this.isUpdating = false
      }
    }
  }
})
