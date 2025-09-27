import { gql } from 'graphql-tag'

export const GetAgentCustomizationOptions = gql`
  query GetAgentCustomizationOptions {
    availableToolNames
    availableInputProcessorNames
    availableLlmResponseProcessorNames
    availableSystemPromptProcessorNames
    availableToolExecutionResultProcessorNames
    availablePhaseHookNames
    availablePromptCategories {
      __typename
      category
      names
    }
  }
`
