import { gql } from 'graphql-tag'

export const CreateWorkspace = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      workspaceId
      name
      fileExplorer
    }
  }
`

export const EXECUTE_BASH_COMMANDS = gql`
  mutation ExecuteBashCommands($workspaceId: String!, $command: String!) {
    executeBashCommands(workspaceId: $workspaceId, command: $command) {
      success
      message
    }
  }
`
