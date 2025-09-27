import { gql } from 'graphql-tag';

export const TerminateAgentInstance = gql`
  mutation TerminateAgentInstance($id: String!) {
    terminateAgentInstance(id: $id) {
      __typename
      success
      message
    }
  }
`;

export const SendAgentUserInput = gql`
  mutation SendAgentUserInput($input: SendAgentUserInputInput!) {
    sendAgentUserInput(input: $input) {
      __typename
      success
      message
      agentId
    }
  }
`;

export const ApproveToolInvocation = gql`
  mutation ApproveToolInvocation($input: ApproveToolInvocationInput!) {
    approveToolInvocation(input: $input) {
      __typename
      success
      message
    }
  }
`;
