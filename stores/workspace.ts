import { defineStore } from 'pinia'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    workspaceTree: null as TreeNode | null,
    selectedWorkspacePath: '' as string
  }),
  actions: {
    setWorkspaceTree(tree: TreeNode) {
      this.workspaceTree = tree
    },
    setSelectedWorkspacePath(path: string) {
      this.selectedWorkspacePath = path
    }
  }
})