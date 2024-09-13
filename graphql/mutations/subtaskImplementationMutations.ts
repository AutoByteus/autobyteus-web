import gql from 'graphql-tag';

export const SendImplementationRequirement = gql`
  mutation SendImplementationRequirement(
    $workspaceRootPath: String!
    $stepId: String!
    $contextFilePaths: [String!]!
    $implementationRequirement: String!
    $llmModel: LLMModel
  ) {
    sendImplementationRequirement(
      workspaceRootPath: $workspaceRootPath
      stepId: $stepId
      contextFilePaths: $contextFilePaths
      implementationRequirement: $implementationRequirement
      llmModel: $llmModel
    )
  }
`;
