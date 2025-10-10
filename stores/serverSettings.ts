import { defineStore } from 'pinia'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
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

      const { client } = useApolloClient()

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

      const { client } = useApolloClient();

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
      
      const { mutate } = useMutation(UPDATE_SERVER_SETTING)
      
      try {
        const result = await mutate({
          key,
          value
        })
        
        const responseMessage = result?.data?.updateServerSetting
        
        if (responseMessage && responseMessage.includes("successfully")) {
          // Reload settings from server to ensure state is consistent
          await this.reloadServerSettings();
          this.isUpdating = false
          return true
        }
        
        this.isUpdating = false
        this.error = responseMessage || 'Failed to update server setting'
        throw new Error(responseMessage || 'Failed to update server setting')
      } catch (error: any) {
        this.isUpdating = false
        this.error = error.message
        console.error(`Failed to update server setting ${key}:`, error)
        throw error
      }
    }
  }
})
