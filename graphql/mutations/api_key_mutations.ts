import gql from 'graphql-tag';

export const SetLLMAPIKey = gql`
  mutation SetLLMAPIKey($model: String!, $apiKey: String!) {
    setLlmApiKey(model: $model, apiKey: $apiKey)
  }
`;

export const GetLLMAPIKey = gql`
  mutation GetLLMAPIKey($model: String!) {
    getLlmApiKey(model: $model)
  }
`;