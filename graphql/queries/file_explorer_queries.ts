import gql from 'graphql-tag';

export const GetFileContent = gql`
  query GetFileContent($workspaceId: String!, $filePath: String!) {
    fileContent(workspaceId: $workspaceId, filePath: $filePath)
  }
`;