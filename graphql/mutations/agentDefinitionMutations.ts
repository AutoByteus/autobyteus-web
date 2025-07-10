import { gql } from 'graphql-tag'

export const CreateAgentDefinition = gql`
  mutation CreateAgentDefinition($input: CreateAgentDefinitionInput!) {
    createAgentDefinition(input: $input) {
      id
      name
      role
      description
      toolNames
      inputProcessorNames
      llmResponseProcessorNames
      systemPromptProcessorNames
      phaseHookNames
      systemPromptCategory
      systemPromptName
      prompts {
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
      id
      name
      role
      description
      toolNames
      inputProcessorNames
      llmResponseProcessorNames
      systemPromptProcessorNames
      phaseHookNames
      systemPromptCategory
      systemPromptName
    }
  }
`

export const DeleteAgentDefinition = gql`
  mutation DeleteAgentDefinition($id: String!) {
    deleteAgentDefinition(id: $id) {
      success
      message
    }
  }
`
