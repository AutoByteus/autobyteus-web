import { gql } from 'graphql-tag';

export const TerminateAgentTeamInstance = gql`
  mutation TerminateAgentTeamInstance($id: String!) {
    terminateAgentTeamInstance(id: $id) {
      success
      message
    }
  }
`;

export const SendMessageToTeam = gql`
  mutation SendMessageToTeam($input: SendMessageToTeamInput!) {
    sendMessageToTeam(input: $input) {
      success
      message
      teamId
    }
  }
`;
