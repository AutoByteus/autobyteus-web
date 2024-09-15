import gql from 'graphql-tag';

export const GetWorkflowConfig = gql`
  query GetWorkflowConfig($workspaceRootPath: String!) {
    workflowConfig(workspaceRootPath: $workspaceRootPath)
  }
`;