import { gql } from '@apollo/client';

export const ImplementationResponseSubscription = gql`
  subscription ImplementationResponse($workspaceRootPath: String!, $stepId: String!) {
    implementationResponse(workspaceRootPath: $workspaceRootPath, stepId: $stepId)
  }
`;