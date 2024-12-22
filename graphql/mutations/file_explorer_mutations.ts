import gql from 'graphql-tag'

export const ApplyFileChange = gql`
  mutation ApplyFileChange($workspaceId: String!, $filePath: String!, $content: String!) {
    applyFileChange(workspaceId: $workspaceId, filePath: $filePath, content: $content)
  }
`

export const RenameFile = gql`
  mutation RenameFile($workspaceId: String!, $filePath: String!, $newName: String!) {
    renameFile(workspaceId: $workspaceId, filePath: $filePath, newName: $newName)
  }
`

export const DeleteFile = gql`
  mutation DeleteFile($workspaceId: String!, $filePath: String!) {
    deleteFile(workspaceId: $workspaceId, filePath: $filePath)
  }
`

export const MoveFile = gql`
  mutation MoveFile($workspaceId: String!, $sourcePath: String!, $destinationPath: String!) {
    moveFile(workspaceId: $workspaceId, sourcePath: $sourcePath, destinationPath: $destinationPath)
  }
`
