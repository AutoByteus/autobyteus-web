import { gql } from 'graphql-tag'

export const CreateAgentTeamInstance = gql`
  mutation CreateAgentTeamInstance($input: CreateAgentTeamInstanceInput!) {
    createAgentTeamInstance(input: $input) {
      __typename
      success
      message
      teamId
    }
  }
`

export const TerminateAgentTeamInstance = gql`
  mutation TerminateAgentTeamInstance($id: String!) {
    terminateAgentTeamInstance(id: $id) {
      __typename
      success
      message
    }
  }
`

export const SendMessageToTeam = gql`
  mutation SendMessageToTeam($input: SendMessageToTeamInput!) {
    sendMessageToTeam(input: $input) {
      __typename
      success
      message
      teamId
    }
  }
`
