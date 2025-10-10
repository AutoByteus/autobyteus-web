import { gql } from 'graphql-tag'

export const RunApplication = gql`
  mutation RunApplication($appId: String!, $input: JSON!) {
    runApplication(appId: $appId, input: $input)
  }
`

// SetApplicationConfiguration has been removed.
