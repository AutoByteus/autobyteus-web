import { gql } from '@apollo/client/core';

export const GetAgentInstances = gql`
  query GetAgentInstances {
    agentInstances {
      id
      name
      role
      currentPhase
      agentDefinitionId
      workspace {
        workspaceId
        name
        workspaceTypeName
        config
      }
    }
  }
`;
