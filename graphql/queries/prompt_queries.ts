import gql from 'graphql-tag';

export const GET_PROMPTS = gql`
  query GetPrompts {
    activePrompts {
      id
      name
      category
      promptContent
      description
      suitableForModel
      createdAt
      parentPromptId
    }
  }
`;

export const GET_PROMPT_BY_ID = gql`
  query GetPromptById($id: String!) {
    promptDetails(id: $id) {
      id
      name
      category
      promptContent
      description
      suitableForModel
      createdAt
      parentPromptId
    }
  }
`;
