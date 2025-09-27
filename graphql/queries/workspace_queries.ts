import { gql } from 'graphql-tag'

export const GetAvailableWorkspaceDefinitions = gql`
  query GetAvailableWorkspaceDefinitions {
    availableWorkspaceDefinitions {
      __typename
      workspaceTypeName
      description
      configSchema {
        __typename
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
      __typename
      workspaceId
      name
      workspaceTypeName
      config
      fileExplorer
      absolutePath
    }
  }
`
