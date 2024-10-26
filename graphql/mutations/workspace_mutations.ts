import gql from 'graphql-tag';

export interface CommandExecutionResult {
  success: boolean;
  message: string;
}

export const AddWorkspace = gql`
  mutation AddWorkspace($workspaceRootPath: String!) {
    addWorkspace(workspaceRootPath: $workspaceRootPath) {
      workspaceId
      name
      fileExplorer
    }
  }
`;

export const EXECUTE_BASH_COMMANDS = gql`
  mutation ExecuteBashCommands($workspaceId: String!, $command: String!) {
    executeBashCommands(workspaceId: $workspaceId, command: $command) {
      success
      message
    }
  }
`;