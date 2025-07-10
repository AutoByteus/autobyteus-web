import { gql } from 'graphql-tag'

export const GetAgentCustomizationOptions = gql`
  query GetAgentCustomizationOptions {
    availableToolNames
    availableInputProcessorNames
    availableLlmResponseProcessorNames
    availableSystemPromptProcessorNames
    availablePhaseHookNames
    availablePromptCategories {
      category
      names
    }
  }
`
