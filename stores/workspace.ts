import { defineStore } from 'pinia'
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable'
import { CreateWorkspace } from '~/graphql/mutations/workspace_mutations'
import { GetAvailableWorkspaceDefinitions, GetAllWorkspaces } from '~/graphql/queries/workspace_queries'
import { FileSystemChangedSubscription } from '~/graphql/subscriptions/fileSystemSubscription'
import type {
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetAvailableWorkspaceDefinitionsQuery,
  GetAllWorkspacesQuery,
  FileSystemChangedSubscription as FileSystemChangedSubscriptionResult,
  FileSystemChangedSubscriptionVariables,
} from '~/generated/graphql'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { createNodeIdToNodeDictionary, handleFileSystemChange as applyTreeChanges } from '~/utils/fileExplorer/fileUtils'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { watch } from 'vue'

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
  workspacesFetched: boolean;
  fileSystemSubscriptions: Map<string, () => void>;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaces: {},
    availableWorkspaceTypes: [],
    loading: false,
    error: null,
    workspacesFetched: false,
    fileSystemSubscriptions: new Map(),
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
          
          // Subscribe to changes for the newly created workspace
          this.subscribeToWorkspaceChanges(newWorkspace.workspaceId);

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
      if (this.availableWorkspaceTypes.length > 0) return Promise.resolve();
      this.loading = true;
      this.error = null;
      const { onResult, onError } = useQuery<GetAvailableWorkspaceDefinitionsQuery>(GetAvailableWorkspaceDefinitions, null, { fetchPolicy: 'network-only' });

      return new Promise<void>((resolve, reject) => {
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
          resolve();
        });

        onError(error => {
          console.error("Failed to fetch available workspace types:", error);
          this.error = error;
          this.loading = false;
          reject(error);
        });
      });
    },
    async fetchAllWorkspaces() {
      if (this.workspacesFetched) return Promise.resolve();
      this.loading = true;
      this.error = null;
      const { onResult, onError } = useQuery<GetAllWorkspacesQuery>(GetAllWorkspaces, null, { fetchPolicy: 'network-only' });

      return new Promise<void>((resolve, reject) => {
          onResult(result => {
              if (result.data) {
                  result.data.workspaces.forEach(ws => {
                      const treeNode = convertJsonToTreeNode(ws.fileExplorer);
                      const nodeIdToNode = createNodeIdToNodeDictionary(treeNode);
                      this.workspaces[ws.workspaceId] = {
                          workspaceId: ws.workspaceId,
                          name: ws.name,
                          fileExplorer: treeNode,
                          nodeIdToNode: nodeIdToNode,
                          workspaceTypeName: ws.workspaceTypeName,
                          workspaceConfig: ws.config,
                      };
                      // Subscribe to changes for each fetched workspace
                      this.subscribeToWorkspaceChanges(ws.workspaceId);
                  });
                  this.workspacesFetched = true;
              }
              this.loading = false;
              resolve();
          });

          onError(error => {
              console.error("Failed to fetch all workspaces:", error);
              this.error = error;
              this.loading = false;
              reject(error);
          });
      });
    },
    handleFileSystemChange(workspaceId: string, event: FileSystemChangeEvent) {
      const workspace = this.workspaces[workspaceId];
      if (!workspace) {
        console.error(`Workspace with ID ${workspaceId} not found`);
        return;
      }
      
      const fileExplorerStore = useFileExplorerStore();
      
      // Apply structural changes to the tree
      applyTreeChanges(workspace.fileExplorer, workspace.nodeIdToNode, event);

      // Handle content invalidation intelligently
      event.changes.forEach(change => {
        if (change.type === 'modify') {
          const node = workspace.nodeIdToNode[change.node_id];
          if (node && node.is_file) {
            const wsFileExplorerState = fileExplorerStore._getOrCreateCurrentWorkspaceState();
            
            // Check if this modify event is an echo of our own save action
            if (wsFileExplorerState.filesToIgnoreNextModify.has(node.path)) {
              // It is. Consume the tag and do not invalidate the content.
              wsFileExplorerState.filesToIgnoreNextModify.delete(node.path);
            } else {
              // It's an external change. Invalidate content to trigger a re-fetch.
              fileExplorerStore.invalidateFileContent(node.path);
            }
          }
        }
      });
    },

    subscribeToWorkspaceChanges(workspaceId: string) {
      // If already subscribed for this workspace, do nothing.
      if (this.fileSystemSubscriptions.has(workspaceId)) {
        return;
      }

      console.log(`Subscribing to file system changes for workspace: ${workspaceId}`);
      const { onResult, onError, subscription } = useSubscription<FileSystemChangedSubscriptionResult, FileSystemChangedSubscriptionVariables>(
        FileSystemChangedSubscription,
        { workspaceId }
      );
      
      onResult(result => {
        if (result.data?.fileSystemChanged) {
          try {
            const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.fileSystemChanged);
            console.log(`Received file system change for ${workspaceId}:`, changeEvent);
            this.handleFileSystemChange(workspaceId, changeEvent);
          } catch (e) {
            console.error('Failed to parse file system change event:', e);
          }
        }
      });

      onError(error => {
        console.error(`Subscription error for workspace ${workspaceId}:`, error);
        // Clean up the subscription on error
        if (this.fileSystemSubscriptions.has(workspaceId)) {
          this.fileSystemSubscriptions.delete(workspaceId);
        }
      });
      
      if (subscription) {
        // Store the subscription's unsubscribe method in the map
        this.fileSystemSubscriptions.set(workspaceId, () => subscription.unsubscribe());
      }
    },

    unsubscribeFromWorkspaceChanges(workspaceId: string) {
      if (this.fileSystemSubscriptions.has(workspaceId)) {
        const unsubscribe = this.fileSystemSubscriptions.get(workspaceId);
        if (unsubscribe) {
          unsubscribe();
        }
        this.fileSystemSubscriptions.delete(workspaceId);
        console.log(`Unsubscribed from file system watcher for workspace: ${workspaceId}`);
      }
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
});

// The watcher plugin is no longer needed with this persistent subscription model.
// Leaving the empty function here for now, but will remove the plugin file.
export function initializeWorkspaceSubscriptionWatcher() {
  // This function is no longer necessary as subscriptions are managed
  // directly within the actions that load/create workspaces.
}
