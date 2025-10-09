import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { EXECUTE_BASH_COMMANDS } from '~/graphql/mutations/workspace_mutations'
import type {
  ExecuteBashCommandsMutation,
  ExecuteBashCommandsMutationVariables
} from '~/generated/graphql'

interface BashCommandResult {
  success: boolean;
  message: string;
}

interface BashCommandState {
  // Stores the result of a command execution, keyed by a unique composite key.
  // Key format: `${conversationId}:${messageIndex}:${segmentIndex}`
  commandResults: Record<string, BashCommandResult>;
  
  // Tracks the keys of commands currently being executed.
  commandsInProgress: Set<string>;
}

export const useBashCommandStore = defineStore('bashCommand', {
  state: (): BashCommandState => ({
    commandResults: {},
    commandsInProgress: new Set(),
  }),

  actions: {
    async executeBashCommand(
      workspaceId: string,
      command: string,
      commandKey: string,
    ): Promise<void> {
      if (this.commandsInProgress.has(commandKey)) {
        console.warn(`Command execution for ${commandKey} is already in progress.`);
        return;
      }
      
      this.commandsInProgress.add(commandKey);
      
      // Clear previous results for this command before re-running.
      delete this.commandResults[commandKey];

      try {
        const { mutate: executeBashCommandsMutation } = useMutation<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>(EXECUTE_BASH_COMMANDS);
        
        const result = await executeBashCommandsMutation({
          workspaceId,
          command
        });
        
        if (result?.data?.executeBashCommands) {
          const { success, message } = result.data.executeBashCommands;
          this.commandResults[commandKey] = { success, message };
        } else {
          const errorMessage = result?.errors?.map(e => e.message).join(', ') || 'Failed to execute bash command: No data returned.';
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`Error executing bash command for ${commandKey}:`, errorMessage);
        this.commandResults[commandKey] = { success: false, message: errorMessage };
      } finally {
        this.commandsInProgress.delete(commandKey);
      }
    },
  },

  getters: {
    isApplyCommandInProgress: (state) => (commandKey: string): boolean => {
      return state.commandsInProgress.has(commandKey);
    },

    isCommandExecuted: (state) => (commandKey: string): boolean => {
      // A command is considered "executed" if it's not in progress and has a result.
      return !!state.commandResults[commandKey] && !state.commandsInProgress.has(commandKey);
    },

    getApplyCommandResult: (state) => (commandKey: string): BashCommandResult | null => {
      return state.commandResults[commandKey] || null;
    },
    
    getApplyCommandError: (state) => (commandKey: string): string | null => {
      const result = state.commandResults[commandKey];
      if (result && !result.success) {
        return result.message;
      }
      return null;
    },
  }
})
