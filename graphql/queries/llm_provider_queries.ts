import gql from 'graphql-tag';

export const GET_LLM_PROVIDER_API_KEY = gql`
  query GetLLMProviderApiKey($provider: String!) {
    getLlmProviderApiKey(provider: $provider)
  }
`;

export const GET_AVAILABLE_LLM_PROVIDERS_WITH_MODELS = gql`
  query GetAvailableLLMProvidersWithModels {
    availableLlmProvidersWithModels {
      provider
      models
    }
  }
`;
