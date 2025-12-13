import { gql } from 'graphql-tag'

export const GetAgentDefinitions = gql`
  query GetAgentDefinitions {
    agentDefinitions {
      __typename
      id
      name
      role
      description
      toolNames
      inputProcessorNames
      llmResponseProcessorNames
      systemPromptProcessorNames
      toolExecutionResultProcessorNames
      toolInvocationPreprocessorNames
      phaseHookNames
      systemPromptCategory
      systemPromptName
      prompts {
        __typename
        id
        name
        category
        promptContent
        description
        suitableForModels
        version
        createdAt
        updatedAt
        parentPromptId
        isActive
        isForAgentTeam
      }
    }
  }
`
