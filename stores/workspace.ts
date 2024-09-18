import { defineStore } from 'pinia'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { useMutation } from '@vue/apollo-composable'
import { AddWorkspace } from '~/graphql/mutations/workspace_mutations'
import type { AddWorkspaceMutation, AddWorkspaceMutationVariables } from '~/generated/graphql'

interface WorkspaceState {
  workspaceTrees: Record<string, TreeNode>;
  selectedWorkspacePath: string;
  workspaces: string[];
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaceTrees: {},
    selectedWorkspacePath: '',
    workspaces: []
  }),
  actions: {
    setWorkspaceTree(path: string, tree: TreeNode) {
      this.workspaceTrees[path] = tree
    },
    setSelectedWorkspacePath(path: string) {
      if (this.workspaceTrees[path]) {
        this.selectedWorkspacePath = path
      } else {
        console.warn(`Attempted to select non-existent workspace path: ${path}`)
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
        const newTree = convertJsonToTreeNode(result.data.addWorkspace)
        this.setWorkspaceTree(newWorkspacePath, newTree)
        this.workspaces.push(newWorkspacePath)
        this.setSelectedWorkspacePath(newWorkspacePath)
      } catch (error) {
        console.error('Error adding workspace:', error)
        throw error
      }
    }
  },
  getters: {
    activeWorkspaceTree: (state): TreeNode | null => 
      state.workspaceTrees[state.selectedWorkspacePath] || null,
    currentWorkspaceTree(): TreeNode | null {
      return this.activeWorkspaceTree
    },
    currentSelectedWorkspacePath: (state): string => state.selectedWorkspacePath,
    allWorkspaces: (state): string[] => state.workspaces
  }
})