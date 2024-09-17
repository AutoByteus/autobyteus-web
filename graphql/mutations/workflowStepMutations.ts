import gql from 'graphql-tag';

export const SendStepRequirement = gql`
  mutation SendStepRequirement(
    $workspaceRootPath: String!
    $stepId: String!
    $contextFilePaths: [String!]!
    $requirement: String!
  ) {
    sendStepRequirement(
      workspaceRootPath: $workspaceRootPath
      stepId: $stepId
      contextFilePaths: $contextFilePaths
      requirement: $requirement
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