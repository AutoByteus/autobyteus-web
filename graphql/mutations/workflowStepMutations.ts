import gql from 'graphql-tag';

export const SendStepRequirement = gql`
  mutation SendStepRequirement(
    $workspaceId: String!
    $stepId: String!
    $contextFilePaths: [ContextFilePathInput!]!
    $requirement: String!
    $conversationId: String
    $llmModel: LLMModel
  ) {
    sendStepRequirement(
      workspaceId: $workspaceId
      stepId: $stepId
      contextFilePaths: $contextFilePaths
      requirement: $requirement
      conversationId: $conversationId
      llmModel: $llmModel
    )
  }
`;