import gql from 'graphql-tag';

export const GetWorkflowConfig = gql`
  query GetWorkflowConfig($workspaceId: String!) {
    workflowConfig(workspaceId: $workspaceId)
  }
`;

export const GetAllWorkspaces = gql`
  query GetAllWorkspaces {
    allWorkspaces {
      workspaceId
      name
      fileExplorer
    }
  }
`;