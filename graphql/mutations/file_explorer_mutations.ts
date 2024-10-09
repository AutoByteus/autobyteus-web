// File: autobyteus-web/graphql/mutations/file_explorer_mutations.ts
import gql from 'graphql-tag'

export const ApplyFileChange = gql`
  mutation ApplyFileChange($workspaceRootPath: String!, $filePath: String!, $content: String!) {
    applyFileChange(workspaceRootPath: $workspaceRootPath, filePath: $filePath, content: $content)
  }
`