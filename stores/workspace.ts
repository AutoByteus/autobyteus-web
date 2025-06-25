import { defineStore } from 'pinia'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { AddWorkspace } from '~/graphql/mutations/workspace_mutations'
import { GetAllWorkspaces } from '~/graphql/queries/workspace_queries'
import type { AddWorkspaceMutation, AddWorkspaceMutationVariables, GetAllWorkspacesQuery } from '~/generated/graphql'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { createNodeIdToNodeDictionary, handleFileSystemChange } from '~/utils/fileExplorer/fileUtils'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'

interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  fileExplorer: TreeNode;
  nodeIdToNode: Record<string, TreeNode>;
}

interface WorkspaceState {
  workspaces: Record<string, WorkspaceInfo>;
  selectedWorkspaceId: string;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaces: {},
    selectedWorkspaceId: ''
  }),
  actions: {
    setSelectedWorkspaceId(id: string) {
      if (this.workspaces[id]) {
        // Do nothing if the same workspace is selected again
        if (this.selectedWorkspaceId === id) {
          return;
        }

        this.selectedWorkspaceId = id
        
        // No longer need to reset any other stores here.
        // They will react to the change in selectedWorkspaceId.

      } else {
        console.warn(`Attempted to select non-existent workspace id: ${id}`)
      }
    },
    async addWorkspace(newWorkspacePath: string, name: string): Promise<void> {
      const { mutate: addWorkspaceMutation } = useMutation<AddWorkspaceMutation, AddWorkspaceMutationVariables>(AddWorkspace)
      try {
        const result = await addWorkspaceMutation({
          workspaceRootPath: newWorkspacePath,
          name: name,
        })
        if (!result || !result.data?.addWorkspace) {
          throw new Error('Failed to add workspace: No data returned')
        }
        const newWorkspaceData = result.data.addWorkspace
        const treeNode = convertJsonToTreeNode(newWorkspaceData.fileExplorer)
        
        const newWorkspaceInfo: WorkspaceInfo = {
          workspaceId: newWorkspaceData.workspaceId,
          name: newWorkspaceData.name,
          fileExplorer: treeNode,
          nodeIdToNode: createNodeIdToNodeDictionary(treeNode)
        }
        
        this.workspaces[newWorkspaceInfo.workspaceId] = newWorkspaceInfo
        this.setSelectedWorkspaceId(newWorkspaceInfo.workspaceId)
      } catch (error) {
        console.error('Error adding workspace:', error)
        throw error
      }
    },
    fetchAllWorkspaces() {
      const { onResult, onError } = useQuery<GetAllWorkspacesQuery>(GetAllWorkspaces)

      onResult((result) => {
        if (result.data?.allWorkspaces) {
          result.data.allWorkspaces.forEach(ws => {
            const treeNode = convertJsonToTreeNode(ws.fileExplorer)
            const workspaceInfo: WorkspaceInfo = {
              workspaceId: ws.workspaceId,
              name: ws.name,
              fileExplorer: treeNode,
              nodeIdToNode: createNodeIdToNodeDictionary(treeNode)
            }
            this.workspaces[workspaceInfo.workspaceId] = workspaceInfo
          })

          if (result.data.allWorkspaces.length > 0 && !this.selectedWorkspaceId) {
            this.setSelectedWorkspaceId(result.data.allWorkspaces[0].workspaceId)
          }
        }
      })

      onError((error) => {
        console.error('Error fetching all workspaces:', error)
      })

      return { onResult, onError }
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
    activeWorkspace: (state): WorkspaceInfo | null => 
      state.workspaces[state.selectedWorkspaceId] || null,
    currentWorkspaceTree(): TreeNode | null {
      const activeWorkspace = this.activeWorkspace
      return activeWorkspace ? activeWorkspace.fileExplorer : null
    },
    currentSelectedWorkspaceId: (state): string => state.selectedWorkspaceId,
    allWorkspaceIds: (state): string[] => Object.keys(state.workspaces)
  }
})
