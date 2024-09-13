import gql from 'graphql-tag';

export const GetWorkflowConfig = gql`
  query GetWorkflowConfig($workspaceRootPath: String!) {
    workflowConfig(workspaceRootPath: $workspaceRootPath)
  }
`;

export const AddWorkspace = gql`
  mutation AddWorkspace($workspaceRootPath: String!) {
    addWorkspace(workspaceRootPath: $workspaceRootPath)
  }
`;
