import gql from 'graphql-tag';

export const CREATE_PROMPT = gql`
  mutation CreatePrompt($input: CreatePromptInput!) {
    createPrompt(input: $input) {
      id
      name
      category
      promptContent
      description
      suitableForModels     # plural
      version
      createdAt
      parentPromptId
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
