import { useServerStore } from '~/stores/serverStore'

export default defineNuxtPlugin(async () => {
  // Only initialize in client-side
  if (process.client) {
    const serverStore = useServerStore()
    
    // Initialize the server store
    serverStore.initialize()
  }
})
