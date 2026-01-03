import { defineStore } from 'pinia'
import { useApolloClient } from '@vue/apollo-composable'
import { EXECUTE_BASH_COMMANDS } from '~/graphql/mutations/workspace_mutations'
import type {
  ExecuteBashCommandsMutation,
  ExecuteBashCommandsMutationVariables
} from '~/generated/graphql'

interface TerminalCommandResult {
  success: boolean;
  message: string;
}

interface TerminalCommandState {
  // Stores the result of a command execution, keyed by a unique composite key.
  // Key format: `${conversationId}:${messageIndex}:${segmentIndex}`
  commandResults: Record<string, TerminalCommandResult>;
  
  // Tracks the keys of commands currently being executed.
  commandsInProgress: Set<string>;
}

export const useTerminalCommandStore = defineStore('terminalCommand', {
  state: (): TerminalCommandState => ({
    commandResults: {},
    commandsInProgress: new Set(),
  }),

  actions: {
    async executeTerminalCommand(
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
        const { client } = useApolloClient();
        
        const { data, errors } = await client.mutate<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>({
          mutation: EXECUTE_BASH_COMMANDS,
          variables: {
            workspaceId,
            command
          }
        });
        
        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }
        
        if (data?.executeBashCommands) {
          const { success, message } = data.executeBashCommands;
          this.commandResults[commandKey] = { success, message };
        } else {
          throw new Error('Failed to execute terminal command: No data returned.');
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`Error executing terminal command for ${commandKey}:`, errorMessage);
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

    getApplyCommandResult: (state) => (commandKey: string): TerminalCommandResult | null => {
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
