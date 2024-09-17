import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { SendStepRequirement, ConfigureStepLLM } from '~/graphql/mutations/workflowStepMutations'
import type { 
  SendStepRequirementMutation, 
  SendStepRequirementMutationVariables, 
  ConfigureStepLlmMutation,
  ConfigureStepLlmMutationVariables,
  LlmModel 
} from '~/generated/graphql'

interface WorkflowStepState {
  stepResult: string | null;
  llmConfigurationResult: string | null;
}

export const useWorkflowStepStore = defineStore('workflowStep', {
  state: (): WorkflowStepState => ({
    stepResult: null,
    llmConfigurationResult: null,
  }),

  actions: {
    async sendStepRequirement(
      workspaceRootPath: string,
      stepId: string,
      contextFilePaths: string[],
      requirement: string,
    ): Promise<void> {
      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement)
      
      try {
        const result = await sendStepRequirementMutation({
            workspaceRootPath,
            stepId,
            contextFilePaths,
            requirement,
          },
        )

        if (result?.data?.sendStepRequirement) {
          this.stepResult = result.data.sendStepRequirement
        } else {
          throw new Error('Failed to send step requirement')
        }
      } catch (error) {
        console.error('Error sending step requirement:', error)
        throw error
      }
    },

    async configureStepLLM(
      workspaceRootPath: string,
      stepId: string,
      llmModel: LlmModel
    ): Promise<void> {
      const { mutate: configureStepLLMMutation } = useMutation<ConfigureStepLlmMutation, ConfigureStepLlmMutationVariables>(ConfigureStepLLM)
      
      try {
        const result = await configureStepLLMMutation({
            workspaceRootPath,
            stepId,
            llmModel,
          },
        )

        if (result?.data?.configureStepLlm) {
          this.llmConfigurationResult = result.data.configureStepLlm
        } else {
          throw new Error('Failed to configure step LLM')
        }
      } catch (error) {
        console.error('Error configuring step LLM:', error)
        throw error
      }
    },

    clearStepResult() {
      this.stepResult = null
    },

    clearLLMConfigurationResult() {
      this.llmConfigurationResult = null
    }
  },
  getters: {
    currentStepResult: (state): string | null => state.stepResult,
    currentLLMConfigurationResult: (state): string | null => state.llmConfigurationResult
  }
})