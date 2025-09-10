import { gql } from 'graphql-tag'

export const GetAgentDefinitions = gql`
  query GetAgentDefinitions {
    agentDefinitions {
      id
      name
      role
      description
      toolNames
      inputProcessorNames
      llmResponseProcessorNames
      systemPromptProcessorNames
      toolExecutionResultProcessorNames
      phaseHookNames
      systemPromptCategory
      systemPromptName
      prompts {
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
