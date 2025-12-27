import { gql } from '@apollo/client/core';

export const GetAgentInstances = gql`
  query GetAgentInstances {
    agentInstances {
      __typename
      id
      name
      role
      currentPhase
      agentDefinitionId
      workspace {
        __typename
        workspaceId
        name
        config
      }
    }
  }
`;
