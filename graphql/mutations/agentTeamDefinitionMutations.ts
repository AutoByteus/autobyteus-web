import { gql } from 'graphql-tag'

export const CreateAgentTeamDefinition = gql`
  mutation CreateAgentTeamDefinition($input: CreateAgentTeamDefinitionInput!) {
    createAgentTeamDefinition(input: $input) {
      id
      name
    }
  }
`

export const UpdateAgentTeamDefinition = gql`
  mutation UpdateAgentTeamDefinition($input: UpdateAgentTeamDefinitionInput!) {
    updateAgentTeamDefinition(input: $input) {
      id
      name
    }
  }
`

export const DeleteAgentTeamDefinition = gql`
  mutation DeleteAgentTeamDefinition($id: String!) {
    deleteAgentTeamDefinition(id: $id) {
      success
      message
    }
  }
`
