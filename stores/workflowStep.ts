import { defineStore } from 'pinia'
import { useSubscription, useMutation } from '@vue/apollo-composable'
import { SendStepRequirement, ConfigureStepLLM } from '~/graphql/mutations/workflowStepMutations'
import { StepResponseSubscription } from '~/graphql/subscriptions/workflowStepSubscriptions'
import type {
  SendStepRequirementMutation,
  SendStepRequirementMutationVariables,
  ConfigureStepLlmMutation,
  ConfigureStepLlmMutationVariables,
  LlmModel,
  StepResponseSubscriptionVariables,
  StepResponseSubscription as StepResponseSubscriptionType
} from '~/generated/graphql'

interface UserMessage {
  type: 'user';
  text: string;
  contextFilePaths: string[];
  timestamp: Date;
}

interface AIMessage {
  type: 'ai';
  text: string;
  timestamp: Date;
}

type Message = UserMessage | AIMessage;

interface WorkflowStepState {
  stepResult: string | null;
  llmConfigurationResult: string | null;
  userRequirement: string;
  messages: Message[];
  isSubscribed: boolean;
  isSending: boolean;
}

export const useWorkflowStepStore = defineStore('workflowStep', {
  state: (): WorkflowStepState => ({
    stepResult: null,
    llmConfigurationResult: null,
    userRequirement: '',
    messages: [],
    isSubscribed: false,
    isSending: false
  }),

  actions: {
    async sendStepRequirementAndSubscribe(
      workspaceRootPath: string,
      stepId: string,
      contextFilePaths: string[],
      requirement: string,
    ): Promise<void> {
      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement)
      
      this.isSending = true;
      try {
        // Send the requirement
        const result = await sendStepRequirementMutation({
          workspaceRootPath,
          stepId,
          contextFilePaths,
          requirement,
        })

        if (result?.data?.sendStepRequirement) {
          this.stepResult = result.data.sendStepRequirement
        } else {
          throw new Error('Failed to send step requirement')
        }

        // Subscribe to responses if not already subscribed
        if (!this.isSubscribed) {
          this.subscribeToStepResponse(workspaceRootPath, stepId)
        }
      } catch (error) {
        console.error('Error sending step requirement:', error)
        throw error
      } finally {
        this.isSending = false;
      }
    },

    subscribeToStepResponse(workspaceRootPath: string, stepId: string) {
      const { onResult, onError } = useSubscription<StepResponseSubscriptionType, StepResponseSubscriptionVariables>(StepResponseSubscription, {
        workspaceRootPath,
        stepId
      })

      onResult(({ data }) => {
        if (data?.stepResponse?.message) {
          this.addAIMessage(data.stepResponse.message) // Extract the 'message' field
        } else if (data?.stepResponse) {
          console.warn('Received stepResponse without a message:', data.stepResponse)
        }
      })

      onError((error) => {
        console.error('Subscription error:', error)
      })
      
      this.isSubscribed = true
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
        })

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
    },

    setUserRequirement(requirement: string) {
      this.userRequirement = requirement
    },

    addUserMessage(payload: { text: string; contextFilePaths: string[]; timestamp: Date }) {
      const { text, contextFilePaths, timestamp } = payload
      this.messages.push({ type: 'user', text, contextFilePaths, timestamp })
    },

    /**
     * Updated addAIMessage to accept a message string.
     * Previously, it might have been handling a plain string, but now we extract the message from StepResponse.
     */
    addAIMessage(message: string) {
      this.messages.push({ type: 'ai', text: message, timestamp: new Date() })
    },

    clearMessagesAfterLastUser() {
      for (let i = this.messages.length - 1; i >= 0; i--) {
        if (this.messages[i].type === 'user') {
          this.messages.splice(i + 1)
          break
        }
      }
    }
  },

  getters: {
    currentStepResult: (state): string | null => state.stepResult,
    currentLLMConfigurationResult: (state): string | null => state.llmConfigurationResult,
    currentUserRequirement: (state): string => state.userRequirement,
    isCurrentlySending: (state): boolean => state.isSending
  }
})
