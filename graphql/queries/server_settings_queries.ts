import gql from 'graphql-tag'

export const GET_SERVER_SETTINGS = gql`
  query GetServerSettings {
    getServerSettings {
      __typename
      key
      value
      description
    }
  }
`
