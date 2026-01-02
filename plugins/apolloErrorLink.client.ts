import { onError } from '@apollo/client/link/error'
import { ApolloLink } from '@apollo/client/core'
import { useApolloClient } from '@vue/apollo-composable'
import { useUiErrorStore } from '~/stores/uiErrorStore'

export default defineNuxtPlugin((nuxtApp) => {
  const store = useUiErrorStore()
  const { client } = nuxtApp.runWithContext(() => useApolloClient())
  if (!client) return

  const marker = '__uiErrorApolloLink__'
  if ((client as any)[marker]) return

  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors && graphQLErrors.length > 0) {
      graphQLErrors.forEach(err => {
        store.push(
          {
            message: err.message || 'GraphQL error',
            operation: operation?.operationName || 'unknown',
            path: err.path,
            extensions: err.extensions
          },
          'apollo'
        )
      })
    }
    if (networkError) {
      store.push(networkError, 'apollo')
    }
  })

  client.link = ApolloLink.from([errorLink, client.link])
  ;(client as any)[marker] = true
})
