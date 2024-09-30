import gql from 'graphql-tag';

export const SendStepRequirement = gql`
  mutation SendStepRequirement(
    $workspaceRootPath: String!
    $stepId: String!
    $contextFilePaths: [String!]!
    $requirement: String!
    $llmModel: LLMModel
  ) {
    sendStepRequirement(
      workspaceRootPath: $workspaceRootPath
      stepId: $stepId
      contextFilePaths: $contextFilePaths
      requirement: $requirement
      llmModel: $llmModel
    )
  }
`;

export const ConfigureStepLLM = gql`
  mutation configureStepLLM(
    $workspaceRootPath: String!
    $stepId: String!
    $llmModel: LLMModel!
  ) {
    configureStepLlm(
      workspaceRootPath: $workspaceRootPath
      stepId: $stepId
      llmModel: $llmModel
    )
  }
`;