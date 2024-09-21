import gql from 'graphql-tag';

export const StepResponseSubscription = gql`
  subscription StepResponse($workspaceRootPath: String!, $stepId: String!) {
    stepResponse(workspaceRootPath: $workspaceRootPath, stepId: $stepId)
  }
`;