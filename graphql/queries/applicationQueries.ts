import { gql } from 'graphql-tag'

export const ListApplications = gql`
  query listApplications {
    listApplications {
      __typename
      id
      name
      description
      icon
      requiredAgents
    }
  }
`

// GetApplicationDetail has been removed.
// All necessary data is now fetched by ListApplications.

export const GetApplicationConfiguration = gql`
  query GetApplicationConfiguration($appId: String!) {
    getApplicationConfiguration(appId: $appId)
  }
`
