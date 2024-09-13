import { defineStore } from 'pinia'
import { useSubscription } from '@vue/apollo-composable'
import { ImplementationResponseSubscription } from '~/graphql/subscriptions/subtaskImplementationSubscriptions'
import type { ImplementationResponseSubscription as ImplementationResponseSubscriptionType, ImplementationResponseSubscriptionVariables } from '~/generated/graphql'

interface ImplementationResponseState {
  implementationResponse: string | null;
  isSubscribed: boolean;
}

export const useImplementationResponseStore = defineStore('implementationResponse', {
  state: (): ImplementationResponseState => ({
    implementationResponse: null,
    isSubscribed: false,
  }),

  actions: {
    async subscribeToImplementationResponse(workspaceRootPath: string, stepId: string): Promise<void> {
      if (this.isSubscribed) {
        console.warn('Already subscribed to implementation response')
        return
      }

      const { onResult, onError } = useSubscription<ImplementationResponseSubscriptionType, ImplementationResponseSubscriptionVariables>(
        ImplementationResponseSubscription,
        { workspaceRootPath, stepId }
      )

      return new Promise<void>((resolve, reject) => {
        onResult(({ data }) => {
          if (data?.implementationResponse) {
            this.implementationResponse = data.implementationResponse
            this.isSubscribed = true
            resolve()
          }
        })

        onError((error) => {
          console.error('Error in implementation response subscription:', error)
          reject(error)
        })
      })
    },

    unsubscribeFromImplementationResponse(): void {
      // Note: The actual unsubscribe logic depends on how you manage subscriptions in your app
      // This is a placeholder to update the state
      this.isSubscribed = false
      this.implementationResponse = null
    },

    clearImplementationResponse(): void {
      this.implementationResponse = null
    }
  },

  getters: {
    currentImplementationResponse: (state): string | null => state.implementationResponse,
    subscriptionStatus: (state): boolean => state.isSubscribed
  }
})