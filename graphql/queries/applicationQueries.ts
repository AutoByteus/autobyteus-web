import { gql } from 'graphql-tag'

export const ListApplications = gql`
  query listApplications {
    listApplications {
      __typename
      id
      name
      description
      icon
    }
  }
`

export const GetApplicationDetail = gql`
  query GetApplicationDetail($appId: String!) {
    getApplicationDetail(appId: $appId) {
      id
      name
      requiredAgents
    }
  }
`

export const GetApplicationConfiguration = gql`
  query GetApplicationConfiguration($appId: String!) {
    getApplicationConfiguration(appId: $appId)
  }
`
