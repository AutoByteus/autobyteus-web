
import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { EXECUTE_BASH_COMMANDS } from '~/graphql/mutations/workspace_mutations'
import type {
  ExecuteBashCommandsMutation,
  ExecuteBashCommandsMutationVariables
} from '~/generated/graphql'
import { useWorkspaceStore } from '~/stores/workspace'
import { ref } from 'vue'

interface BashCommandState {
  commandResults: Record<string, Record<number, { success: boolean; message: string }>>
  commandErrors: Record<string, Record<number, string | null>>
  pendingCommands: string[]
}

export const useBashCommandStore = defineStore('bashCommand', {
  state: (): BashCommandState => ({
    commandResults: {},
    commandErrors: {},
    pendingCommands: []
  }),

  actions: {
    async executeBashCommand(
      workspaceId: string,
      command: string,
      conversationId: string,
      messageIndex: number
    ): Promise<void> {
      const { mutate: executeBashCommandsMutation } = useMutation<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>(EXECUTE_BASH_COMMANDS)
      
      if (!this.commandResults[conversationId]) {
        this.commandResults[conversationId] = {}
      }
      if (!this.commandResults[conversationId][messageIndex]) {
        this.commandResults[conversationId][messageIndex] = { success: false, message: '' }
      }
      
      this.commandErrors[conversationId] = this.commandErrors[conversationId] || {}
      this.commandErrors[conversationId][messageIndex] = null
      
      try {
        const result = await executeBashCommandsMutation({
          workspaceId,
          command
        })
        if (result?.data?.executeBashCommands?.success) {
          this.commandResults[conversationId][messageIndex] = { 
            success: true, 
            message: result.data.executeBashCommands.message 
          }
        } else {
          throw new Error(result?.data?.executeBashCommands?.message || 'Failed to execute bash command')
        }
      } catch (error) {
        console.error('Error executing bash command:', error)
        this.commandErrors[conversationId][messageIndex] = (error as Error).message
        throw error
      }
    },

    enqueueCommand(command: string) {
      this.pendingCommands.push(command)
    },

    dequeueCommand(): string | undefined {
      return this.pendingCommands.shift()
    },

    hasPendingCommands(): boolean {
      return this.pendingCommands.length > 0
    },

    isApplyCommandInProgress(conversationId: string, messageIndex: number): boolean {
      const result = this.commandResults[conversationId]?.[messageIndex]
      return result ? !result.success && result.message === '' : false
    },

    isCommandExecuted(conversationId: string, messageIndex: number): boolean {
      return this.commandResults[conversationId]?.[messageIndex]?.success || false
    },

    getApplyCommandError(conversationId: string, messageIndex: number): string | null {
      return this.commandErrors[conversationId]?.[messageIndex] || null
    },

    setApplyCommandError(conversationId: string, messageIndex: number, error: string | null) {
      this.commandErrors[conversationId] = this.commandErrors[conversationId] || {}
      this.commandErrors[conversationId][messageIndex] = error
    }
  },

  getters: {
    getCommandResult: (state) => (conversationId: string, messageIndex: number) => {
      return state.commandResults[conversationId]?.[messageIndex] || { success: false, message: '' }
    },
    
    nextPendingCommand: (state): string | undefined => {
      return state.pendingCommands[0]
    }
  }
})
