import { defineStore } from 'pinia'
import { useSubscription } from '@vue/apollo-composable'
import { StepResponseSubscription } from '~/graphql/subscriptions/workflowStepSubscriptions'
import type { StepResponseSubscription as StepResponseSubscriptionType, StepResponseSubscriptionVariables } from '~/generated/graphql'

interface StepResponseState {
  stepResponse: string | null;
  isSubscribed: boolean;
}

export const useStepResponseStore = defineStore('stepResponse', {
  state: (): StepResponseState => ({
    stepResponse: null,
    isSubscribed: false,
  }),

  actions: {
    async subscribeToStepResponse(workspaceRootPath: string, stepId: string): Promise<void> {
      if (this.isSubscribed) {
        console.warn('Already subscribed to step response')
        return
      }

      const { onResult, onError } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(
        StepResponseSubscription,
        { workspaceRootPath, stepId }
      )

      return new Promise<void>((resolve, reject) => {
        onResult(({ data }) => {
          if (data?.stepResponse) {
            this.stepResponse = data.stepResponse
            this.isSubscribed = true
            resolve()
          }
        })

        onError((error) => {
          console.error('Error in step response subscription:', error)
          reject(error)
        })
      })
    },

    unsubscribeFromStepResponse(): void {
      // Note: The actual unsubscribe logic depends on how you manage subscriptions in your app
      // This is a placeholder to update the state
      this.isSubscribed = false
      this.stepResponse = null
    },

    clearStepResponse(): void {
      this.stepResponse = null
    }
  },

  getters: {
    currentStepResponse: (state): string | null => state.stepResponse,
    subscriptionStatus: (state): boolean => state.isSubscribed
  }
})