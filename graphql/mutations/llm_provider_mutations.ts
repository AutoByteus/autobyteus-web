import gql from 'graphql-tag';

export const SET_LLM_PROVIDER_API_KEY = gql`
  mutation SetLLMProviderApiKey($provider: String!, $apiKey: String!) {
    setLlmProviderApiKey(provider: $provider, apiKey: $apiKey)
  }
`;