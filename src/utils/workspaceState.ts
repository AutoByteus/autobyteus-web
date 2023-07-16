import { ref, readonly } from 'vue';
import { TreeNode } from './fileExplorer/TreeNode';

// Actual state
const _workspaceTree = ref<TreeNode | null>(null);

// Readonly state to prevent unwanted mutations
export const workspaceTree = readonly(_workspaceTree);

export function setWorkspaceTree(newTree: TreeNode) {
    _workspaceTree.value = newTree;
}
