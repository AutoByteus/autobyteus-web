import gql from 'graphql-tag';

export const SearchCodeEntities = gql`
  query SearchCodeEntities($query: String!) {
    searchCodeEntities(query: $query)
  }
`;