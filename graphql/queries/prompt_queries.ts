import gql from 'graphql-tag';

export const GET_PROMPTS = gql`
  query GetPrompts {
    activePrompts {
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

export const GET_PROMPT_BY_ID = gql`
  query GetPromptById($id: ID!) {
    promptDetails(id: $id) {
      id
      name
      category
      promptContent
      description
      suitableForModels     # plural
      version
      createdAt
      updatedAt
      parentPromptId
    }
  }
`;
