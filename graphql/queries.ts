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

export const SearchCodeEntities = gql`
  query SearchCodeEntities($query: String!) {
    searchCodeEntities(query: $query)
  }
`;