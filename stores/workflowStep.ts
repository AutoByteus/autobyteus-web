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
  StepResponseSubscription as StepResponseSubscriptionType,
  ContextFilePathInput
} from '~/generated/graphql'
import type { Conversation, Message, ContextFilePath } from '~/types/conversation'
import apiService from '~/services/api'
import { useWorkspaceStore } from '~/stores/workspace'

interface WorkflowStepState {
  stepResult: string | null;
  llmConfigurationResult: string | null;
  userRequirement: string;
  contextFilePaths: ContextFilePath[];
  conversationsByStep: Record<string, Conversation[]>;
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
    contextFilePaths: [],
    conversationsByStep: {},
    activeConversationId: null,
    isSubscribed: false,
    isSending: false,
    selectedLLMModel: null,
  }),
  actions: {
    resetStepState(stepId: string) {
      this.stepResult = null
      this.llmConfigurationResult = null
      this.userRequirement = ''
      this.contextFilePaths = []
      this.activeConversationId = null
      this.isSubscribed = false
      this.isSending = false
      this.selectedLLMModel = null

      // Only reset conversations for the current step if they don't exist
      if (!this.conversationsByStep[stepId]) {
        this.conversationsByStep[stepId] = []
      }
    },

    createNewConversation(stepId: string): string {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      if (!this.conversationsByStep[stepId]) {
        this.conversationsByStep[stepId] = []
      }
      this.conversationsByStep[stepId].push(newConversation)
      this.activeConversationId = newConversation.id
      return newConversation.id
    },

    getActiveConversationId(stepId: string): string | null {
      if (!this.activeConversationId || !this.conversationsByStep[stepId]?.some(c => c.id === this.activeConversationId)) {
        const conversations = this.conversationsByStep[stepId] || []
        if (conversations.length > 0) {
          this.activeConversationId = conversations[conversations.length - 1].id
        } else {
          this.activeConversationId = null
        }
      }
      return this.activeConversationId
    },

    activateConversation(stepId: string, conversationId: string) {
      const conversation = this.conversationsByStep[stepId]?.find(c => c.id === conversationId)
      if (conversation) {
        this.activeConversationId = conversationId
      }
    },

    addUserMessage(stepId: string, text: string, contextFilePaths: ContextFilePath[]) {
      const activeConversation = this.conversationsByStep[stepId]?.find(c => c.id === this.activeConversationId)
      if (activeConversation) {
        activeConversation.messages.push({
          type: 'user',
          text,
          contextFilePaths,
          timestamp: new Date()
        })
        activeConversation.updatedAt = new Date()
      }
    },

    addAIMessage(stepId: string, message: string) {
      const conversation = this.conversationsByStep[stepId]?.find(c => c.id === this.activeConversationId)
      if (conversation) {
        conversation.messages.push({ type: 'ai', text: message, timestamp: new Date() })
        conversation.updatedAt = new Date()
      }
    },

    getConversationHistory(stepId: string) {
      return (this.conversationsByStep[stepId] || []).slice().reverse().slice(0, 10)
    },

    addContextFilePath(contextFilePath: ContextFilePath) {
      this.contextFilePaths.push(contextFilePath)
    },

    removeContextFilePath(index: number) {
      this.contextFilePaths.splice(index, 1)
    },

    clearContextFilePaths() {
      this.contextFilePaths = []
    },

    async sendStepRequirementAndSubscribe(
      workspaceRootPath: string,
      stepId: string,
      requirement: string,
      llmModel?: LlmModel
    ): Promise<void> {
      const { mutate: sendStepRequirementMutation } = useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirement)

      this.isSending = true;
      try {
        const formattedContextFilePaths: ContextFilePathInput[] = this.contextFilePaths.map(path => ({
          path: path.path,
          type: path.type
        }))

        const result = await sendStepRequirementMutation({
          workspaceRootPath,
          stepId,
          contextFilePaths: formattedContextFilePaths,
          requirement,
          llmModel
        })

        if (result?.data?.sendStepRequirement) {
          this.stepResult = result.data.sendStepRequirement
          if (llmModel) {
            this.selectedLLMModel = llmModel
          }
          this.addUserMessage(stepId, requirement, this.contextFilePaths)
          this.clearContextFilePaths()
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
          this.addAIMessage(stepId, data.stepResponse)
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

    async uploadFile(file: File): Promise<string> {
      const workspaceStore = useWorkspaceStore()
      const workspaceRootPath = workspaceStore.currentSelectedWorkspacePath
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspaceRootPath', workspaceRootPath)

      try {
        const response = await apiService.post<{ filePath: string }>('/upload-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data.filePath
      } catch (error) {
        console.error('Error uploading file:', error)
        throw error
      }
    },

    clearAllContextFilePaths() {
      this.contextFilePaths = []
    }
  },

  getters: {
    currentStepResult: (state): string | null => state.stepResult,
    currentLLMConfigurationResult: (state): string | null => state.llmConfigurationResult,
    currentUserRequirement: (state): string => state.userRequirement,
    isCurrentlySending: (state): boolean => state.isSending,
    currentSelectedLLMModel: (state): LlmModel | null => state.selectedLLMModel,
    isFirstMessage: (state) => (stepId: string): boolean => {
      const conversations = state.conversationsByStep[stepId] || []
      return conversations.length === 0 || (conversations.length === 1 && conversations[0].messages.length === 0)
    },
    activeConversation: (state) => (stepId: string): Conversation | null => {
      return state.conversationsByStep[stepId]?.find(c => c.id === state.activeConversationId) || null
    },
    currentContextPaths: (state): ContextFilePath[] => state.contextFilePaths,
  }
})