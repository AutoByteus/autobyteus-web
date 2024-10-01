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

interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStepState {
  stepResult: string | null;
  llmConfigurationResult: string | null;
  userRequirement: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  isSubscribed: boolean;
  isSending: boolean;
  selectedLLMModel: LlmModel | null;
}

export const useWorkflowStepStore = defineStore('workflowStep', {
  state: (): WorkflowStepState => ({
    stepResult: null,
    llmConfigurationResult: null,
    userRequirement: '',
    conversations: [],
    activeConversationId: null,
    isSubscribed: false,
    isSending: false,
    selectedLLMModel: null
  }),

  actions: {
    createConversation(): string {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.conversations.push(newConversation)
      this.activeConversationId = newConversation.id
      return newConversation.id
    },

    ensureActiveConversation(): string {
      if (!this.activeConversationId || !this.conversations.some(c => c.id === this.activeConversationId)) {
        return this.createConversation()
      }
      return this.activeConversationId
    },

    activateConversation(conversationId: string) {
      const conversation = this.conversations.find(c => c.id === conversationId)
      if (conversation) {
        this.activeConversationId = conversationId
      }
    },

    deleteConversation(conversationId: string) {
      const index = this.conversations.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        this.conversations.splice(index, 1)
        if (this.activeConversationId === conversationId) {
          this.activeConversationId = this.conversations.length > 0 ? this.conversations[0].id : null
        }
      }
    },

    async sendStepRequirementAndSubscribe(
      workspaceRootPath: string,
      stepId: string,
      contextFilePaths: string[],
      requirement: string,
      llmModel?: LlmModel
    ): Promise<void> {
      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement)
      
      this.isSending = true;
      try {
        const result = await sendStepRequirementMutation({
          workspaceRootPath,
          stepId,
          contextFilePaths,
          requirement,
          llmModel
        })

        if (result?.data?.sendStepRequirement) {
          this.stepResult = result.data.sendStepRequirement
          if (llmModel) {
            this.selectedLLMModel = llmModel
          }
          this.addUserMessage({ text: requirement, contextFilePaths, timestamp: new Date() })
        } else {
          throw new Error('Failed to send step requirement')
        }

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
        if (data?.stepResponse) {
          this.addAIMessage(data.stepResponse)
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
          this.selectedLLMModel = llmModel
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

    updateUserRequirement(requirement: string) {
      this.userRequirement = requirement
    },

    addUserMessage(payload: { text: string; contextFilePaths: string[]; timestamp: Date }) {
      if (this.activeConversationId) {
        const conversation = this.conversations.find(c => c.id === this.activeConversationId)
        if (conversation) {
          conversation.messages.push({ type: 'user', ...payload })
          conversation.updatedAt = new Date()
        }
      }
    },

    addAIMessage(message: string) {
      if (this.activeConversationId) {
        const conversation = this.conversations.find(c => c.id === this.activeConversationId)
        if (conversation) {
          conversation.messages.push({ type: 'ai', text: message, timestamp: new Date() })
          conversation.updatedAt = new Date()
        }
      }
    },

    resetStepState() {
      this.stepResult = null
      this.llmConfigurationResult = null
      this.userRequirement = ''
      this.conversations = []
      this.activeConversationId = null
      this.isSubscribed = false
      this.isSending = false
      this.selectedLLMModel = null
    },

    getConversationHistory() {
      return this.conversations.slice().reverse().slice(0, 10)
    }
  },

  getters: {
    currentStepResult: (state): string | null => state.stepResult,
    currentLLMConfigurationResult: (state): string | null => state.llmConfigurationResult,
    currentUserRequirement: (state): string => state.userRequirement,
    isCurrentlySending: (state): boolean => state.isSending,
    currentSelectedLLMModel: (state): LlmModel | null => state.selectedLLMModel,
    isFirstMessage: (state): boolean => {
      const activeConversation = state.conversations.find(c => c.id === state.activeConversationId)
      return activeConversation ? activeConversation.messages.length === 0 : true
    },
    activeConversation: (state): Conversation | null => {
      return state.conversations.find(c => c.id === state.activeConversationId) || null
    }
  }
})