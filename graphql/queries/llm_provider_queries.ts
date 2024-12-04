import gql from 'graphql-tag';

export const GET_LLM_PROVIDER_API_KEY = gql`
  query GetLLMProviderApiKey($provider: String!) {
    getLlmProviderApiKey(provider: $provider)
  }
`;

export const GET_AVAILABLE_MODELS = gql`
  query GetAvailableModels {
    availableModels
  }
`;

export const GET_AVAILABLE_PROVIDERS = gql`
  query GetAvailableProviders {
    availableProviders
  }
`;