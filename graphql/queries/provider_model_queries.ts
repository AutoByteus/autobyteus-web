// File: autobyteus-web/graphql/queries/provider_model_queries.ts

import gql from 'graphql-tag';

export const GetProviderModels = gql`
  query GetProviderModels {
    getModelsByProvider {
      provider
      models {
        name
        value
      }
    }
  }
`;