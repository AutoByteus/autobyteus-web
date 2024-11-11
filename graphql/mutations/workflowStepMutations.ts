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

export const CloseConversation = gql`
  mutation CloseConversation(
    $workspaceId: String!
    $stepId: String!
    $conversationId: String!
  ) {
    closeConversation(
      workspaceId: $workspaceId
      stepId: $stepId
      conversationId: $conversationId
    )
  }
`;