// File: autobyteus-web/graphql/queries/api_key_queries.ts

import gql from 'graphql-tag';

export const GetLLMAPIKey = gql`
  query GetLLMAPIKey($model: String!) {
    getLlmApiKey(model: $model)
  }
`;