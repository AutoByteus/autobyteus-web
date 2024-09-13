import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { SendImplementationRequirement } from '~/graphql/mutations/subtaskImplementationMutations'
import type { SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables, LlmModel } from '~/generated/graphql'

interface SubtaskImplementationState {
  implementationResult: string | null;
}

export const useSubtaskImplementationStore = defineStore('subtaskImplementation', {
  state: (): SubtaskImplementationState => ({
    implementationResult: null,
  }),

  actions: {
    async sendImplementationRequirement(
      workspaceRootPath: string,
      stepId: string,
      contextFilePaths: string[],
      implementationRequirement: string,
      llmModel: LlmModel
    ): Promise<void> {
      const { mutate: sendImplementationRequirementMutation } = useMutation<SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables>(SendImplementationRequirement)
      
      try {
        const { data } = await sendImplementationRequirementMutation({
          variables: {
            workspaceRootPath,
            stepId,
            contextFilePaths,
            implementationRequirement,
            llmModel,
          },
        })

        if (data?.sendImplementationRequirement) {
          this.implementationResult = data.sendImplementationRequirement
        } else {
          throw new Error('Failed to send implementation requirement')
        }
      } catch (error) {
        console.error('Error sending implementation requirement:', error)
        throw error
      }
    },

    clearImplementationResult() {
      this.implementationResult = null
    }
  },
  getters: {
    currentImplementationResult: (state): string | null => state.implementationResult
  }
})