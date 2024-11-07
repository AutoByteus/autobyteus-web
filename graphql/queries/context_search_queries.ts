import gql from 'graphql-tag';

export const SearchContextFiles = gql`
  query SearchContextFiles($workspaceId: String!, $query: String!) {
    hackathonSearch(workspaceId: $workspaceId, query: $query)
  }
`;