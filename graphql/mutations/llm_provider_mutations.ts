import gql from 'graphql-tag';

export const SET_LLM_PROVIDER_API_KEY = gql`
  mutation SetLLMProviderApiKey($provider: String!, $apiKey: String!) {
    setLlmProviderApiKey(provider: $provider, apiKey: $apiKey)
  }
`;

export const RELOAD_LLM_MODELS = gql`
  mutation ReloadLLMModels {
    reloadLlmModels
  }
`;

export const RELOAD_LLM_PROVIDER_MODELS = gql`
  mutation ReloadLLMProviderModels($provider: String!) {
    reloadLlmProviderModels(provider: $provider)
  }
`;
