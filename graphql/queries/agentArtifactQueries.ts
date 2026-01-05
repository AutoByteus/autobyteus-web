import { gql } from '@apollo/client/core';

export const GetAgentArtifacts = gql`
  query GetAgentArtifacts($agentId: String!) {
    agentArtifacts(agentId: $agentId) {
      id
      agentId
      path
      type
      createdAt
      updatedAt
    }
  }
`;
