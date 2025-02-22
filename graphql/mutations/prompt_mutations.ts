import gql from 'graphql-tag';

export const CREATE_PROMPT = gql`
  mutation CreatePrompt($input: CreatePromptInput!) {
    createPrompt(input: $input) {
      id
      name
      category
      promptText
      createdAt
      parentPromptId
    }
  }
`;
