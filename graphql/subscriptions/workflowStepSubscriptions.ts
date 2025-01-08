
import gql from 'graphql-tag';

export const StepResponseSubscription = gql`
  subscription StepResponse($workspaceId: String!, $stepId: String!, $conversationId: String!) {
    stepResponse(workspaceId: $workspaceId, stepId: $stepId, conversationId: $conversationId) {
      conversationId
      messageChunk
      isComplete
      promptTokens
      completionTokens
      totalTokens
      promptCost
      completionCost
      totalCost
    }
  }
`;
