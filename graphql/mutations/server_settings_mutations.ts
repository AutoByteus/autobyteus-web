import gql from 'graphql-tag'

export const UPDATE_SERVER_SETTING = gql`
  mutation UpdateServerSetting($key: String!, $value: String!) {
    updateServerSetting(key: $key, value: $value)
  }
`
