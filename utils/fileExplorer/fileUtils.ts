import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import type { FileSystemChangeEvent, AddChange, DeleteChange, RenameChange, MoveChange } from '~/types/fileSystemChangeTypes'

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

/**
 * Applies a series of changes (add, delete, rename, move) to the front-end tree.
 * Ensures that children remain sorted (directories first, then files) after each change.
 */
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
        case 'move':
          handleMoveChange(nodeIdToNode, change);
          break;
        default:
          console.warn(`Unhandled change type: ${(change as { type: string }).type}`);
      }
    } catch (error) {
      console.error('Error handling file system change:', error);
    }
  });
}

/**
 * Adds a new node under the specified parent, then ensures children are sorted.
 */
function handleAddChange(nodeIdToNode: Record<string, TreeNode>, change: AddChange): void {
  const parentNode = nodeIdToNode[change.parent_id];
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`);
  }
  const newNode = TreeNode.fromObject(change.node);

  // Insert into parent's children in sorted order
  parentNode.addChild(newNode);

  // Update our dictionary
  nodeIdToNode[newNode.id] = newNode;
}

/**
 * Removes a child by id from its parent, if known. Then remove from dictionary.
 */
function handleDeleteChange(nodeIdToNode: Record<string, TreeNode>, change: DeleteChange): void {
  const parentNode = nodeIdToNode[change.parent_id];
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`);
  }
  parentNode.children = parentNode.children.filter(child => child.id !== change.node_id);
  delete nodeIdToNode[change.node_id];
}

/**
 * Renames a node. We also re-sort the parent's children afterward.
 */
function handleRenameChange(nodeIdToNode: Record<string, TreeNode>, change: RenameChange): void {
  const node = nodeIdToNode[change.node.id];
  if (!node) {
    throw new Error(`Node with id ${change.node.id} not found`);
  }
  node.name = change.node.name;
  node.path = change.node.path;

  const parentNode = nodeIdToNode[change.parent_id];
  if (parentNode) {
    // Re-sort the parent's children now that this node's name changed
    parentNode.sortChildren();
  }
}

/**
 * Moves a node from old_parent_id to new_parent_id, updating name/path if needed.
 * We remove from the old parent's children array, and add to the new parent's array in sorted order.
 */
function handleMoveChange(nodeIdToNode: Record<string, TreeNode>, change: MoveChange): void {
  const node = nodeIdToNode[change.node.id];
  const oldParent = nodeIdToNode[change.old_parent_id];
  const newParent = nodeIdToNode[change.new_parent_id];
  
  if (!node || !oldParent || !newParent) {
    throw new Error('One or more nodes not found during move operation');
  }

  // Remove from old parent's children
  oldParent.children = oldParent.children.filter(child => child.id !== node.id);
  
  // Update node properties
  node.name = change.node.name;
  node.path = change.node.path;
  
  // Add to new parent's children in sorted order
  newParent.addChild(node);
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
