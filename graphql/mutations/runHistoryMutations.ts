import { gql } from 'graphql-tag';

export const ContinueRun = gql`
  mutation ContinueRun($input: ContinueRunInput!) {
    continueRun(input: $input) {
      success
      message
      runId
      ignoredConfigFields
    }
  }
`;
