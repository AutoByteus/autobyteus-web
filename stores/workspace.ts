import { defineStore } from 'pinia'
import { useMutation } from '@vue/apollo-composable'
import { AddWorkspace } from '~/graphql/mutations/workspace_mutations'
import type { AddWorkspaceMutation, AddWorkspaceMutationVariables } from '~/generated/graphql'
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
        this.selectedWorkspaceId = id
      } else {
        console.warn(`Attempted to select non-existent workspace id: ${id}`)
      }
    },
    async addWorkspace(newWorkspacePath: string): Promise<void> {
      const { mutate: addWorkspaceMutation } = useMutation<AddWorkspaceMutation, AddWorkspaceMutationVariables>(AddWorkspace)
      try {
        const result = await addWorkspaceMutation({
          workspaceRootPath: newWorkspacePath,
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