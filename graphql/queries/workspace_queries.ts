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

export const GetAllWorkspaces = gql`
  query GetAllWorkspaces {
    workspaces {
      workspaceId
      name
      workspaceTypeName
      config
      fileExplorer
    }
  }
`
