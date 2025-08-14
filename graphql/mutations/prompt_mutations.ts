import gql from 'graphql-tag';

export const CREATE_PROMPT = gql`
  mutation CreatePrompt($input: CreatePromptInput!) {
    createPrompt(input: $input) {
      id
      name
      category
      promptContent
      description
      suitableForModels
      version
      createdAt
      parentPromptId
      isActive
      isForAgentTeam
    }
  }
`;

export const UPDATE_PROMPT = gql`
  mutation UpdatePrompt($input: UpdatePromptInput!) {
    updatePrompt(input: $input) {
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
`;

export const ADD_NEW_PROMPT_REVISION = gql`
  mutation AddNewPromptRevision($input: AddNewPromptRevisionInput!) {
    addNewPromptRevision(input: $input) {
      id
      name
      category
      promptContent
      description
      suitableForModels
      version
      createdAt
      parentPromptId
      isActive
      isForAgentTeam
    }
  }
`;

export const MARK_ACTIVE_PROMPT = gql`
  mutation MarkActivePrompt($input: MarkActivePromptInput!) {
    markActivePrompt(input: $input) {
      id
      isActive
    }
  }
`;

export const SYNC_PROMPTS = gql`
  mutation SyncPrompts {
    syncPrompts {
      success
      message
      initialCount
      finalCount
      syncedCount
    }
  }
`;

export const DELETE_PROMPT = gql`
  mutation DeletePrompt($input: DeletePromptInput!) {
    deletePrompt(input: $input) {
      success
      message
    }
  }
`;
