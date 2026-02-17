import { gql } from 'graphql-tag';

export const ContinueRun = gql`
  mutation ContinueRun($input: ContinueRunInput!) {
    continueRun(input: $input) {
      success
      message
      agentId
      ignoredConfigFields
    }
  }
`;

export const DeleteRunHistory = gql`
  mutation DeleteRunHistory($agentId: String!) {
    deleteRunHistory(agentId: $agentId) {
      success
      message
    }
  }
`;

export const DeleteTeamRunHistory = gql`
  mutation DeleteTeamRunHistory($teamId: String!) {
    deleteTeamRunHistory(teamId: $teamId) {
      success
      message
    }
  }
`;
