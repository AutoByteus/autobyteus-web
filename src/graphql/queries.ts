import gql from 'graphql-tag';

export const GetWorkflowConfig = gql`
  query GetWorkflowConfig {
    workflowConfig
  }
`;

export const AddWorkspace = gql`
  mutation AddWorkspace($workspaceRootPath: String!) {
    addWorkspace(workspaceRootPath: $workspaceRootPath)
  }
`;