import { useApolloClient } from '@vue/apollo-composable'
import { useNuxtApp } from '#app'

export const getApolloClient = (clientId = 'default') => {
  const nuxtApp = useNuxtApp()
  const clients = nuxtApp._apolloClients || nuxtApp.$apollo?.clients
  const directClient =
    (clientId && clients?.[clientId]) ||
    clients?.default ||
    nuxtApp.$apollo?.defaultClient
  if (directClient) {
    return directClient
  }

  return nuxtApp.runWithContext(() => useApolloClient().client)
}
