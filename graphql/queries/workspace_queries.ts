import { gql } from 'graphql-tag'

export const GetAvailableWorkspaceDefinitions = gql`
  query GetAvailableWorkspaceDefinitions {
    availableWorkspaceDefinitions {
      workspaceTypeName
      description
      configSchema {
        name
        type
        description
        required
        defaultValue
      }
    }
  }
`

// REMOVED: GetAllWorkspaces query is no longer used.
