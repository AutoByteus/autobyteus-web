import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { CreateWorkspace } from '~/graphql/mutations/workspace_mutations'
import { GetAvailableWorkspaceDefinitions } from '~/graphql/queries/workspace_queries'
import type {
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetAvailableWorkspaceDefinitionsQuery
} from '~/generated/graphql'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { createNodeIdToNodeDictionary, handleFileSystemChange } from '~/utils/fileExplorer/fileUtils'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import { useAgentSessionStore } from '~/stores/agentSessionStore';

// Interface for workspace type definitions used in the creation modal
export interface WorkspaceType {
  name: string;
  description: string;
  config_schema: {
    parameters: {
      name: string;
      param_type: string;
      description: string;
      required: boolean;
      default_value?: any;
    }[];
  };
}

// Richer WorkspaceInfo to include file explorer data
interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  fileExplorer: TreeNode;
  nodeIdToNode: Record<string, TreeNode>;
}

// REFACTORED: WorkspaceState no longer tracks the selected ID.
interface WorkspaceState {
  workspaces: Record<string, WorkspaceInfo>;
  availableWorkspaceTypes: WorkspaceType[];
  loading: boolean;
  error: any;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaces: {},
    availableWorkspaceTypes: [],
    loading: false,
    error: null,
  }),
  actions: {    
    async createWorkspace(workspaceTypeName: string, config: Record<string, any>): Promise<string> {
      this.loading = true;
      this.error = null;
      const { mutate } = useMutation<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>(CreateWorkspace);
      try {
        const result = await mutate({
          input: {
            workspaceTypeName: workspaceTypeName,
            config: config
          }
        });

        if (result?.errors) {
          throw new Error(result.errors.map(e => e.message).join(', '));
        }

        if (result?.data?.createWorkspace) {
          const newWorkspace = result.data.createWorkspace;
          
          const treeNode = convertJsonToTreeNode(newWorkspace.fileExplorer);
          const nodeIdToNode = createNodeIdToNodeDictionary(treeNode);

          this.workspaces[newWorkspace.workspaceId] = {
            workspaceId: newWorkspace.workspaceId,
            name: newWorkspace.name,
            fileExplorer: treeNode,
            nodeIdToNode: nodeIdToNode,
          };
          return newWorkspace.workspaceId;
        } else {
          throw new Error('Failed to create workspace: No data returned.');
        }
      } catch (e: any) {
        this.error = e;
        console.error('Error creating workspace:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async fetchAvailableWorkspaceTypes() {
      this.loading = true;
      this.error = null;
      const { onResult, onError } = useQuery<GetAvailableWorkspaceDefinitionsQuery>(GetAvailableWorkspaceDefinitions, null, { fetchPolicy: 'network-only' });

      onResult(result => {
        if (result.data) {
          this.availableWorkspaceTypes = result.data.availableWorkspaceDefinitions.map(def => ({
            name: def.workspaceTypeName,
            description: def.description,
            config_schema: {
              parameters: def.configSchema.map(param => ({
                name: param.name,
                param_type: param.type,
                description: param.description,
                required: param.required,
                default_value: param.defaultValue,
              }))
            }
          }));
        }
        this.loading = false;
      });

      onError(error => {
        console.error("Failed to fetch available workspace types:", error);
        this.error = error;
        this.loading = false;
      });
    },
    handleFileSystemChange(workspaceId: string, event: FileSystemChangeEvent) {
      const workspace = this.workspaces[workspaceId];
      if (!workspace) {
        console.error(`Workspace with ID ${workspaceId} not found`);
        return;
      }
      handleFileSystemChange(workspace.fileExplorer, workspace.nodeIdToNode, event);
    }
  },
  getters: {
    // REWRITTEN: activeWorkspace now derives its value from agentSessionStore.
    activeWorkspace(): WorkspaceInfo | null {
      const agentSessionStore = useAgentSessionStore();
      const activeSession = agentSessionStore.activeSession;
      if (activeSession?.workspaceId && this.workspaces[activeSession.workspaceId]) {
        return this.workspaces[activeSession.workspaceId];
      }
      return null;
    },
    
    // REMOVED: currentSelectedWorkspaceId is no longer needed.
    
    allWorkspaceIds: (state): string[] => Object.keys(state.workspaces),
    
    // REWRITTEN: currentWorkspaceTree now uses the new activeWorkspace getter.
    currentWorkspaceTree(): TreeNode | null {
      return this.activeWorkspace ? this.activeWorkspace.fileExplorer : null;
    }
  }
})
