import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import type { FileSystemChangeEvent, AddChange, DeleteChange, RenameChange } from '~/types/fileSystemChangeTypes'

export function getFilePathsFromFolder(node: TreeNode): string[] {
  const filePaths: string[] = [];
  function traverse(currentNode: TreeNode) {
    if (currentNode.is_file) {
      filePaths.push(currentNode.path);
    } else {
      currentNode.children.forEach(child => traverse(child));
    }
  }
  traverse(node);
  return filePaths;
}

export async function determineFileType(filePath: string): Promise<'text' | 'image'> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const lowercasePath = filePath.toLowerCase()
  
  for (const ext of imageExtensions) {
    if (lowercasePath.endsWith(ext)) {
      return 'image'
    }
  }
  
  return 'text'
}

export function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function createNodeIdToNodeDictionary(root: TreeNode): Record<string, TreeNode> {
  const dictionary: Record<string, TreeNode> = {};
  
  function traverse(node: TreeNode) {
    dictionary[node.id] = node;
    for (const child of node.children) {
      traverse(child);
    }
  }
  
  traverse(root);
  return dictionary;
}

export function handleFileSystemChange(
  workspaceTree: TreeNode,
  nodeIdToNode: Record<string, TreeNode>,
  event: FileSystemChangeEvent
): void {
  event.changes.forEach(change => {
    try {
      switch (change.type) {
        case 'add':
          handleAddChange(nodeIdToNode, change);
          break;
        case 'delete':
          handleDeleteChange(nodeIdToNode, change);
          break;
        case 'rename':
          handleRenameChange(nodeIdToNode, change);
          break;
        default:
          console.warn(`Unhandled change type: ${(change as { type: string }).type}`);
      }
    } catch (error) {
      console.error('Error handling file system change:', error);
    }
  });
}

function handleAddChange(nodeIdToNode: Record<string, TreeNode>, change: AddChange): void {
  const parentNode = nodeIdToNode[change.parent_id];
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`);
  }
  const newNode = TreeNode.fromObject(change.node);
  parentNode.addChild(newNode);
  nodeIdToNode[newNode.id] = newNode;
}

function handleDeleteChange(nodeIdToNode: Record<string, TreeNode>, change: DeleteChange): void {
  const parentNode = nodeIdToNode[change.parent_id];
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`);
  }
  parentNode.children = parentNode.children.filter(child => child.id !== change.node_id);
  delete nodeIdToNode[change.node_id];
}

function handleRenameChange(nodeIdToNode: Record<string, TreeNode>, change: RenameChange): void {
  const node = nodeIdToNode[change.node.id];
  if (!node) {
    throw new Error(`Node with id ${change.node.id} not found`);
  }
  node.name = change.node.name;
  node.path = change.node.path;
  if (change.previous_id && change.previous_id !== change.node.id) {
    delete nodeIdToNode[change.previous_id];
    nodeIdToNode[change.node.id] = node;
  }
}

export function findFileByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node
    }
    if (node.children) {
      const found = findFileByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}