import gql from 'graphql-tag';

export const GetWorkflowConfig = gql`
  query GetWorkflowConfig($workspaceId: String!) {
    workflowConfig(workspaceId: $workspaceId)
  }
`;