import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
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
      this.isLoading = true
      this.error = null
      
      const { onResult, onError } = useQuery(GET_SERVER_SETTINGS, null, {
        fetchPolicy: 'network-only' // Force network fetch, bypassing cache
      })
      
      return new Promise((resolve, reject) => {
        onResult(({ data }) => {
          this.isLoading = false
          if (data?.getServerSettings) {
            this.settings = data.getServerSettings
            resolve(data.getServerSettings)
          } else {
            this.settings = []
            resolve([])
          }
        })
        
        onError((error) => {
          this.isLoading = false
          this.error = error.message
          console.error('Failed to fetch server settings:', error)
          reject(error)
        })
      })
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
        
        // Check if the response contains a success message
        if (responseMessage && responseMessage.includes("successfully")) {
          // Update the local state using immutable pattern
          // Instead of directly modifying the object property (which is read-only)
          // create a new array with the updated setting
          const index = this.settings.findIndex(setting => setting.key === key)
          if (index >= 0) {
            // Create a new array with all the old items
            const updatedSettings = [...this.settings]
            // Replace the item at the found index with a new object
            updatedSettings[index] = {
              ...this.settings[index], // copy all properties
              value: value // update only the value property
            }
            // Replace the entire settings array
            this.settings = updatedSettings
          }
          
          this.isUpdating = false
          return true
        }
        
        // If we don't get a success message, throw an error with the response
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
