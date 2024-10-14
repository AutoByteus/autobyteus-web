// File: autobyteus-web/graphql/mutations/file_explorer_mutations.ts
import gql from 'graphql-tag'

export const ApplyFileChange = gql`
  mutation ApplyFileChange($workspaceId: String!, $filePath: String!, $content: String!) {
    applyFileChange(workspaceId: $workspaceId, filePath: $filePath, content: $content)
  }
`