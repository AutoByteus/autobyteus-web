import { defineStore } from 'pinia'
import { TreeNode, convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'
import { useMutation } from '@vue/apollo-composable'
import { AddWorkspace } from '~/graphql/mutations/workspace_mutations'
import type { AddWorkspaceMutation, AddWorkspaceMutationVariables } from '~/generated/graphql'

interface WorkspaceState {
  workspaceTree: TreeNode | null;
  selectedWorkspacePath: string;
  workspaces: string[];
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaceTree: null,
    selectedWorkspacePath: '',
    workspaces: []
  }),
  actions: {
    setWorkspaceTree(tree: TreeNode) {
      this.workspaceTree = tree
    },
    setSelectedWorkspacePath(path: string) {
      this.selectedWorkspacePath = path
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
        this.setWorkspaceTree(convertJsonToTreeNode(result.data.addWorkspace))
        this.workspaces.push(newWorkspacePath)
        this.setSelectedWorkspacePath(newWorkspacePath)
      } catch (error) {
        console.error('Error adding workspace:', error)
        throw error
      }
    }
  },
  getters: {
    currentWorkspaceTree: (state): TreeNode | null => state.workspaceTree,
    currentSelectedWorkspacePath: (state): string => state.selectedWorkspacePath,
    allWorkspaces: (state): string[] => state.workspaces
  }
})