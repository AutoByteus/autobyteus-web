import gql from 'graphql-tag';

export const StepResponseSubscription = gql`
  subscription StepResponse($workspaceId: String!, $stepId: String!) {
    stepResponse(workspaceId: $workspaceId, stepId: $stepId)
  }
`;