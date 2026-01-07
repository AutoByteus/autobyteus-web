import { defineStore } from 'pinia'
import { useApolloClient } from '@vue/apollo-composable'
import { CreateWorkspace } from '~/graphql/mutations/workspace_mutations'
import { GetAllWorkspaces } from '~/graphql/queries/workspace_queries'
import type {
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetAllWorkspacesQuery,
} from '~/generated/graphql'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { createNodeIdToNodeDictionary, handleFileSystemChange as applyTreeChanges } from '~/utils/fileExplorer/fileUtils'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { FileExplorerStreamingService } from '~/services/fileExplorerStreaming/FileExplorerStreamingService'
import { useRuntimeConfig } from '#app'

export interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  fileExplorer: TreeNode;
  nodeIdToNode: Record<string, TreeNode>;
  workspaceConfig: any;
  absolutePath: string | null;
}

interface WorkspaceState {
  workspaces: Record<string, WorkspaceInfo>;
  loading: boolean;
  error: any;
  workspacesFetched: boolean;
  fileSystemConnections: Map<string, FileExplorerStreamingService>;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaces: {},
    loading: false,
    error: null,
    workspacesFetched: false,
    fileSystemConnections: new Map(),
  }),
  actions: {    
    async createWorkspace(config: { root_path: string }): Promise<string> {
      this.loading = true;
      this.error = null;
      const { client } = useApolloClient();
      try {
        const { data, errors } = await client.mutate<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>({
          mutation: CreateWorkspace,
          variables: {
            input: {
              rootPath: config.root_path
            }
          }
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        if (data?.createWorkspace) {
          const newWorkspace = data.createWorkspace;
          
          const treeNode = convertJsonToTreeNode(newWorkspace.fileExplorer);
          const nodeIdToNode = createNodeIdToNodeDictionary(treeNode);

          this.workspaces[newWorkspace.workspaceId] = {
            workspaceId: newWorkspace.workspaceId,
            name: newWorkspace.name,
            fileExplorer: treeNode,
            nodeIdToNode: nodeIdToNode,
            workspaceConfig: config,
            absolutePath: newWorkspace.absolutePath ?? null,
          };
          
          // Connect to WebSocket for file system changes
          this.connectToFileSystemChanges(newWorkspace.workspaceId);

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
    async fetchAllWorkspaces() {
      if (this.workspacesFetched) return;
      this.loading = true;
      this.error = null;
      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetAllWorkspacesQuery>({
          query: GetAllWorkspaces,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        if (data?.workspaces) {
          data.workspaces.forEach(ws => {
            const treeNode = convertJsonToTreeNode(ws.fileExplorer);
            const nodeIdToNode = createNodeIdToNodeDictionary(treeNode);
            this.workspaces[ws.workspaceId] = {
              workspaceId: ws.workspaceId,
              name: ws.name,
              fileExplorer: treeNode,
              nodeIdToNode: nodeIdToNode,
              workspaceConfig: ws.config,
              absolutePath: ws.absolutePath ?? null,
            };
            // Connect to WebSocket for file system changes
            this.connectToFileSystemChanges(ws.workspaceId);
          });
          this.workspacesFetched = true;
        }
      } catch (error: any) {
        console.error("Failed to fetch all workspaces:", error);
        this.error = error;
        throw error;
      } finally {
        this.loading = false;
      }
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
            const wsFileExplorerState = fileExplorerStore._getOrCreateWorkspaceState(workspaceId);
            
            // Check if this modify event is an echo of our own save action
            if (wsFileExplorerState.filesToIgnoreNextModify.has(node.path)) {
              // It is. Consume the tag and do not invalidate the content.
              wsFileExplorerState.filesToIgnoreNextModify.delete(node.path);
            } else {
              // It's an external change. Invalidate content to trigger a re-fetch.
              fileExplorerStore.invalidateFileContent(node.path, workspaceId);
            }
          }
        }
      });
    },

    /**
     * Connect to WebSocket for real-time file system changes.
     * Replaces the GraphQL subscription with direct WebSocket connection.
     */
    connectToFileSystemChanges(workspaceId: string) {
      // If already connected for this workspace, do nothing.
      if (this.fileSystemConnections.has(workspaceId)) {
        return;
      }

      console.log(`[Workspace] Connecting to file system changes for workspace: ${workspaceId}`);
      
      // Get the WebSocket endpoint from runtime config (like terminal does)
      const config = useRuntimeConfig();
      const wsEndpoint = config.public.fileExplorerWsEndpoint as string || 'ws://localhost:8000/ws/file-explorer';

      const service = new FileExplorerStreamingService(wsEndpoint, {
        onFileSystemChange: (event: FileSystemChangeEvent) => {
          console.log(`[Workspace] Received file system change for ${workspaceId}:`, event);
          this.handleFileSystemChange(workspaceId, event);
        },
        onConnect: (sessionId: string) => {
          console.log(`[Workspace] Connected to file system changes: ${sessionId}`);
        },
        onDisconnect: (reason?: string) => {
          console.log(`[Workspace] Disconnected from file system changes: ${reason}`);
        },
        onError: (error: Error) => {
          console.error(`[Workspace] File system WebSocket error for ${workspaceId}:`, error);
        }
      });

      service.connect(workspaceId);
      this.fileSystemConnections.set(workspaceId, service);
    },

    /**
     * Disconnect from file system changes WebSocket.
     */
    disconnectFromFileSystemChanges(workspaceId: string) {
      const service = this.fileSystemConnections.get(workspaceId);
      if (service) {
        service.disconnect();
        this.fileSystemConnections.delete(workspaceId);
        console.log(`[Workspace] Disconnected from file system watcher for workspace: ${workspaceId}`);
      }
    },

    /**
     * Fetches children of a folder for lazy loading.
     * Called when a user expands a folder that hasn't had its children loaded yet.
     */
    async fetchFolderChildren(workspaceId: string, folderPath: string): Promise<void> {
      const workspace = this.workspaces[workspaceId];
      if (!workspace) {
        console.error(`Workspace ${workspaceId} not found`);
        return;
      }

      const { client } = useApolloClient();
      try {
        const { GetFolderChildren } = await import('~/graphql/queries/file_explorer_queries');
        const { data, errors } = await client.query({
          query: GetFolderChildren,
          variables: { workspaceId, folderPath },
          fetchPolicy: 'network-only', // Always fetch fresh data
        });

        if (errors && errors.length > 0) {
          console.error('Error fetching folder children:', errors);
          return;
        }

        if (data?.folderChildren) {
          const folderData = JSON.parse(data.folderChildren);
          
          // Check for error response
          if (folderData.error) {
            console.error('Server error:', folderData.error);
            return;
          }

          // Case 1: Root Initialization (for transient workspaces)
          if (folderPath === '' || folderPath === '/') {
              // If we are still using the placeholder 'root' ID, update it to the actual ID from server
              if (workspace.fileExplorer.id === 'root' && folderData.id !== 'root') {
                  const oldId = workspace.fileExplorer.id;
                  
                  // Update root node properties
                  workspace.fileExplorer.id = folderData.id;
                  workspace.fileExplorer.path = folderData.path || folderData.id; // Fallback if path missing
                  if (folderData.name) workspace.fileExplorer.name = folderData.name;

                  // Update dictionary
                  delete workspace.nodeIdToNode[oldId];
                  workspace.nodeIdToNode[folderData.id] = workspace.fileExplorer;
              }
          }

          // Find the folder node in the tree
          let folderNode = workspace.nodeIdToNode[folderData.id];
          
          if (!folderNode && (folderPath === '' || folderPath === '/')) {
              // Fallback: use root if ID mismatch or not found yet (should be covered above)
              folderNode = workspace.fileExplorer; 
          }

          if (!folderNode) {
            console.error(`Folder node not found for path: ${folderPath}`);
            return;
          }

          // Clear existing children and add new ones from server
          folderNode.children = [];
          for (const childData of folderData.children) {
            const childNode = TreeNode.fromObject(childData);
            folderNode.addChild(childNode);
            // Add to nodeIdToNode lookup
            workspace.nodeIdToNode[childNode.id] = childNode;
          }

          // Mark folder as loaded
          folderNode.childrenLoaded = true;
        }
      } catch (error) {
        console.error('Error fetching folder children:', error);
      }
    },

    /**
     * Registers a skill workspace without persisting it to the backend database.
     * Starts with an empty tree and connects to the file system watcher.
     * Returns the generated workspaceId.
     */
    registerSkillWorkspace(skillId: string): string {
        const workspaceId = `skill_ws_${skillId}`;
        const name = skillId; // Use ID as name for now

        if (this.workspaces[workspaceId]) {
            return workspaceId;
        }
        
        // Create a placeholder root node
        const rootNode = new TreeNode(name, "", false, [], "root", true);
        const nodeIdToNode = createNodeIdToNodeDictionary(rootNode);
        
        this.workspaces[workspaceId] = {
             workspaceId,
             name,
             fileExplorer: rootNode,
             nodeIdToNode,
             workspaceConfig: { isTransient: true },
             absolutePath: null, // Unknown until interactions happen, or not needed
        };

        // Connect to WS immediately to start receiving events
        this.connectToFileSystemChanges(workspaceId);
        
        // Trigger a fetch of the root children to populate the tree
        this.fetchFolderChildren(workspaceId, "");

        return workspaceId;
    },

    /**
     * Unregisters a skill workspace and cleans up connections.
     */
    unregisterSkillWorkspace(workspaceId: string) {
        if (!this.workspaces[workspaceId]) return;
        
        this.disconnectFromFileSystemChanges(workspaceId);
        delete this.workspaces[workspaceId];
        
        // Also cleanup file explorer state if any
        const fileExplorerStore = useFileExplorerStore();
        if (fileExplorerStore.fileExplorerStateByWorkspace.has(workspaceId)) {
            fileExplorerStore.fileExplorerStateByWorkspace.delete(workspaceId);
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
