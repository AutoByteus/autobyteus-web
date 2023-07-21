import { ref, readonly } from 'vue';
import { TreeNode } from '../utils/fileExplorer/TreeNode';

// Actual states
const _workspaceTree = ref<TreeNode | null>(null);
const _selectedWorkspacePath = ref<string | null>(null);

// Readonly states to prevent unwanted mutations
export const workspaceTree = readonly(_workspaceTree);
export const selectedWorkspacePath = readonly(_selectedWorkspacePath);

export function setWorkspaceTree(newTree: TreeNode) {
    _workspaceTree.value = newTree;
}

export function setSelectedWorkspacePath(path: string) {
    _selectedWorkspacePath.value = path;
}
