import { gql } from 'graphql-tag'

export const ListApplications = gql`
  query ListApplications {
    listApplications {
      __typename
      id
      name
      description
      icon
    }
  }
`
