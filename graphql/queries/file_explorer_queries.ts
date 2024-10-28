// File: autobyteus-web/graphql/queries/file_explorer_queries.ts

import gql from 'graphql-tag';

export const GetFileContent = gql`
  query GetFileContent($workspaceId: String!, $filePath: String!) {
    fileContent(workspaceId: $workspaceId, filePath: $filePath)
  }
`;

export const SearchFiles = gql`
  query SearchFiles($workspaceId: String!, $query: String!) {
    searchFiles(workspaceId: $workspaceId, query: $query)
  }
`;