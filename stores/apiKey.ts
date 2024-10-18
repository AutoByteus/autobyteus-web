import { defineStore } from 'pinia'

interface APIKeyState {
  keys: Record<string, string>
}

export const useAPIKeyStore = defineStore('apiKey', {
  state: (): APIKeyState => ({
    keys: {}
  }),

  actions: {
    setAPIKey(model: string, key: string) {
      this.keys[model] = key
      return true
    },

    getAPIKey(model: string) {
      return this.keys[model] || null
    }
  }
})
