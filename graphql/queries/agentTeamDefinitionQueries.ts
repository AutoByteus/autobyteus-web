import { gql } from 'graphql-tag'

export const GetAgentTeamDefinitions = gql`
  query GetAgentTeamDefinitions {
    agentTeamDefinitions {
      id
      name
      description
      role
      coordinatorMemberName
      nodes {
        memberName
        referenceId
        referenceType
        dependencies
      }
    }
  }
`
