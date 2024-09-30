import gql from 'graphql-tag';

export const GetFileContent = gql`
  query GetFileContent($workspaceRootPath: String!, $filePath: String!) {
    fileContent(workspaceRootPath: $workspaceRootPath, filePath: $filePath)
  }
`;