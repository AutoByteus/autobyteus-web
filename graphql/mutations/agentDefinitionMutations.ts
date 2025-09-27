import { gql } from 'graphql-tag'

export const CreateAgentDefinition = gql`
  mutation CreateAgentDefinition($input: CreateAgentDefinitionInput!) {
    createAgentDefinition(input: $input) {
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
      phaseHookNames
      systemPromptCategory
      systemPromptName
      prompts {
        __typename
        id
        name
        category
      }
    }
  }
`

export const UpdateAgentDefinition = gql`
  mutation UpdateAgentDefinition($input: UpdateAgentDefinitionInput!) {
    updateAgentDefinition(input: $input) {
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
      phaseHookNames
      systemPromptCategory
      systemPromptName
    }
  }
`

export const DeleteAgentDefinition = gql`
  mutation DeleteAgentDefinition($id: String!) {
    deleteAgentDefinition(id: $id) {
      __typename
      success
      message
    }
  }
`
