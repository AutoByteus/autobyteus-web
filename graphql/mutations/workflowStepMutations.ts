import gql from 'graphql-tag';

export const SendStepRequirement = gql`
  mutation SendStepRequirement(
    $workspaceId: String!
    $stepId: String!
    $contextFilePaths: [ContextFilePathInput!]!
    $requirement: String!
    $llmModel: LLMModel
  ) {
    sendStepRequirement(
      workspaceId: $workspaceId
      stepId: $stepId
      contextFilePaths: $contextFilePaths
      requirement: $requirement
      llmModel: $llmModel
    )
  }
`;

export const ConfigureStepLLM = gql`
  mutation ConfigureStepLLM(
    $workspaceId: String!
    $stepId: String!
    $llmModel: LLMModel!
  ) {
    configureStepLlm(
      workspaceId: $workspaceId
      stepId: $stepId
      llmModel: $llmModel
    )
  }
`;