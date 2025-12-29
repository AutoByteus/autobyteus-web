import { gql } from 'graphql-tag'

export const GetAgentCustomizationOptions = gql`
  query GetAgentCustomizationOptions {
    availableToolNames
    availableInputProcessors {
      __typename
      name
      isMandatory
    }
    availableLlmResponseProcessors {
      __typename
      name
      isMandatory
    }
    availableSystemPromptProcessors {
      __typename
      name
      isMandatory
    }
    availableToolExecutionResultProcessors {
      __typename
      name
      isMandatory
    }
    availableToolInvocationPreprocessors {
      name
      isMandatory
    }
    availableLifecycleProcessors {
      name
      isMandatory
    }
    availablePromptCategories {
      __typename
      category
      names
    }
  }
`
