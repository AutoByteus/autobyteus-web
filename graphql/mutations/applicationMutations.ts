import { gql } from 'graphql-tag'

export const RunApplication = gql`
  mutation RunApplication($appId: String!, $input: JSON!) {
    runApplication(appId: $appId, input: $input)
  }
`

export const SetApplicationConfiguration = gql`
  mutation SetApplicationConfiguration($appId: String!, $configData: JSON!) {
    setApplicationConfiguration(appId: $appId, configData: $configData)
  }
`
