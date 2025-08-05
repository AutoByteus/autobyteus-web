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
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';

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

export interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  fileExplorer: TreeNode;
  nodeIdToNode: Record<string, TreeNode>;
  workspaceTypeName: string;
  workspaceConfig: any;
}

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
            workspaceTypeName: workspaceTypeName,
            workspaceConfig: config,
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
      if (this.availableWorkspaceTypes.length > 0) return; // Avoid refetching
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
    activeWorkspace(): WorkspaceInfo | null {
      const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
      const agentProfileStore = useAgentLaunchProfileStore();
      const teamContextsStore = useAgentTeamContextsStore();

      const { selectedProfileId, selectedProfileType } = selectedLaunchProfileStore;
      if (!selectedProfileId) return null;

      let workspaceId: string | null = null;

      if (selectedProfileType === 'agent') {
        const agentProfile = agentProfileStore.activeLaunchProfile;
        workspaceId = agentProfile?.workspaceId || null;
      } else if (selectedProfileType === 'team') {
        const focusedMember = teamContextsStore.focusedMemberContext;
        workspaceId = focusedMember?.config.workspaceId || null;
      }
      
      return workspaceId ? this.workspaces[workspaceId] : null;
    },
    
    allWorkspaceIds: (state): string[] => Object.keys(state.workspaces),
    allWorkspaces: (state): WorkspaceInfo[] => Object.values(state.workspaces),
    
    currentWorkspaceTree(): TreeNode | null {
      return this.activeWorkspace ? this.activeWorkspace.fileExplorer : null;
    }
  }
})
