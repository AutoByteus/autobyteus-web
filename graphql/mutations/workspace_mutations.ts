import gql from 'graphql-tag';

export const AddWorkspace = gql`
  mutation AddWorkspace($workspaceRootPath: String!) {
    addWorkspace(workspaceRootPath: $workspaceRootPath) {
      workspaceId
      name
      fileExplorer
    }
  }
`;