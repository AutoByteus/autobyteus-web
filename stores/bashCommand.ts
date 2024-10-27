import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { EXECUTE_BASH_COMMANDS } from '~/graphql/mutations/workspace_mutations'
import type {
  ExecuteBashCommandsMutation,
  ExecuteBashCommandsMutationVariables
} from '~/generated/graphql'
import { useWorkspaceStore } from '~/stores/workspace'

interface BashCommandState {
  commandResults: Record<string, Record<number, Record<number, { success: boolean; message: string }>>>
  commandErrors: Record<string, Record<number, string | null>>
}

export const useBashCommandStore = defineStore('bashCommand', {
  state: (): BashCommandState => ({
    commandResults: {},
    commandErrors: {},
  }),
  actions: {
    async executeBashCommand(
      workspaceId: string,
      command: string,
      conversationId: string,
      messageIndex: number,
      cmdIndex: number
    ): Promise<void> {
      const { mutate: executeBashCommandsMutation } = useMutation<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>(EXECUTE_BASH_COMMANDS)
      const workspaceStore = useWorkspaceStore()
      if (!this.commandResults[conversationId]) {
        this.commandResults[conversationId] = {}
      }
      if (!this.commandResults[conversationId][messageIndex]) {
        this.commandResults[conversationId][messageIndex] = {}
      }
      // Initialize command state
      this.commandResults[conversationId][messageIndex][cmdIndex] = { success: false, message: '' }
      this.commandErrors[conversationId] = this.commandErrors[conversationId] || {}
      this.commandErrors[conversationId][messageIndex] = null
      try {
        const result = await executeBashCommandsMutation({
          workspaceId,
          command
        })
        if (result?.data?.executeBashCommands?.success) {
          this.commandResults[conversationId][messageIndex][cmdIndex] = { success: true, message: result.data.executeBashCommands.message }
        } else {
          throw new Error(result?.data?.executeBashCommands?.message || 'Failed to execute bash command')
        }
      } catch (error) {
        console.error('Error executing bash command:', error)
        this.commandErrors[conversationId][messageIndex] = (error as Error).message
        throw error
      }
    },
    isApplyCommandInProgress(conversationId: string, messageIndex: number, cmdIndex: number): boolean {
      return !this.commandResults[conversationId]?.[messageIndex]?.[cmdIndex]?.success &&
             this.commandResults[conversationId]?.[messageIndex]?.[cmdIndex]?.message === ''
    },
    isCommandExecuted(conversationId: string, messageIndex: number, cmdIndex: number): boolean {
      return this.commandResults[conversationId]?.[messageIndex]?.[cmdIndex]?.success || false
    },
    getApplyCommandError(conversationId: string, messageIndex: number): string | null {
      return this.commandErrors[conversationId]?.[messageIndex] || null
    },
    setApplyCommandError(conversationId: string, messageIndex: number, error: string | null) {
      this.commandErrors[conversationId] = this.commandErrors[conversationId] || {}
      this.commandErrors[conversationId][messageIndex] = error
    },
  },
  getters: {
    getCommandResult: (state) => (conversationId: string, messageIndex: number, cmdIndex: number) => {
      return state.commandResults[conversationId]?.[messageIndex]?.[cmdIndex] || { success: false, message: '' }
    }
  }
})