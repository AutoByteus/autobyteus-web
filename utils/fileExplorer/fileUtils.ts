import { TreeNode } from '~/utils/fileExplorer/TreeNode'

export function getFilePathsFromFolder(node: TreeNode): string[] {
  const filePaths: string[] = [];

  function traverse(currentNode: TreeNode) {
    if (currentNode.is_file) {
      filePaths.push(currentNode.path);
    } else {
      // If it's a folder, traverse its children
      currentNode.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return filePaths;
}