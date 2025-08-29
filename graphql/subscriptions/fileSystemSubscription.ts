import { gql } from 'graphql-tag'

export const FileSystemChangedSubscription = gql`
  subscription FileSystemChanged($workspaceId: String!) {
    fileSystemChanged(workspaceId: $workspaceId)
  }
`
