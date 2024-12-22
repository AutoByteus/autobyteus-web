import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import type { FileSystemChangeEvent, AddChange, DeleteChange, RenameChange, MoveChange } from '~/types/fileSystemChangeTypes'

/**
 * Recursively retrieves all file paths from a given folder node.
 * @param node The root TreeNode to traverse.
 * @returns An array of file paths.
 */
export function getFilePathsFromFolder(node: TreeNode): string[] {
  const filePaths: string[] = []
  function traverse(currentNode: TreeNode) {
    if (currentNode.is_file) {
      filePaths.push(currentNode.path)
    } else {
      currentNode.children.forEach(child => traverse(child))
    }
  }
  traverse(node)
  return filePaths
}

/**
 * Determines the type of a file based on its extension.
 * @param filePath The path of the file.
 * @returns 'text' if it's a text file, 'image' if it's an image file.
 */
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

/**
 * Finds a node by its unique identifier.
 * @param root The root TreeNode to start the search.
 * @param id The unique identifier of the node.
 * @returns The TreeNode if found, otherwise null.
 */
export function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

/**
 * Creates a dictionary mapping node IDs to their respective TreeNodes.
 * @param root The root TreeNode to traverse.
 * @returns A dictionary with node IDs as keys and TreeNodes as values.
 */
export function createNodeIdToNodeDictionary(root: TreeNode): Record<string, TreeNode> {
  const dictionary: Record<string, TreeNode> = {}

  function traverse(node: TreeNode) {
    dictionary[node.id] = node
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(root)
  return dictionary
}

/**
 * Handles various file system change events by delegating to specific handlers.
 * @param workspaceTree The root TreeNode of the workspace.
 * @param nodeIdToNode A dictionary mapping node IDs to TreeNodes.
 * @param event The FileSystemChangeEvent containing changes.
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
          handleAddChange(nodeIdToNode, change)
          break
        case 'delete':
          handleDeleteChange(nodeIdToNode, change)
          break
        case 'rename':
          handleRenameChange(nodeIdToNode, change)
          break
        case 'move':
          handleMoveChange(nodeIdToNode, change)
          break
        default:
          console.warn(`Unhandled change type: ${(change as { type: string }).type}`)
      }
    } catch (error) {
      console.error('Error handling file system change:', error)
    }
  })
}

/**
 * Handles the addition of a new node.
 * @param nodeIdToNode A dictionary mapping node IDs to TreeNodes.
 * @param change The AddChange event.
 */
function handleAddChange(nodeIdToNode: Record<string, TreeNode>, change: AddChange): void {
  const parentNode = nodeIdToNode[change.parent_id]
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`)
  }
  const newNode = TreeNode.fromObject(change.node)
  parentNode.addChild(newNode)
  nodeIdToNode[newNode.id] = newNode
}

/**
 * Handles the deletion of a node.
 * @param nodeIdToNode A dictionary mapping node IDs to TreeNodes.
 * @param change The DeleteChange event.
 */
function handleDeleteChange(nodeIdToNode: Record<string, TreeNode>, change: DeleteChange): void {
  const parentNode = nodeIdToNode[change.parent_id]
  if (!parentNode) {
    throw new Error(`Parent node with id ${change.parent_id} not found`)
  }
  const index = parentNode.children.findIndex(child => child.id === change.node_id)
  if (index === -1) {
    throw new Error(`Node with id ${change.node_id} not found under parent ${change.parent_id}`)
  }
  parentNode.children.splice(index, 1)
  delete nodeIdToNode[change.node_id]
}

/**
 * Handles the renaming of a node.
 * @param nodeIdToNode A dictionary mapping node IDs to TreeNodes.
 * @param change The RenameChange event.
 */
function handleRenameChange(nodeIdToNode: Record<string, TreeNode>, change: RenameChange): void {
  const node = nodeIdToNode[change.node.id]
  if (!node) {
    throw new Error(`Node with id ${change.node.id} not found`)
  }
  node.name = change.node.name
  node.path = change.node.path
  if (change.previous_id && change.previous_id !== change.node.id) {
    delete nodeIdToNode[change.previous_id]
    nodeIdToNode[change.node.id] = node
  }
  // Update paths of all descendants if it's a folder
  if (!node.is_file && node.children.length > 0) {
    updateChildPaths(node)
  }
}

/**
 * Handles the moving of a node.
 * @param nodeIdToNode A dictionary mapping node IDs to TreeNodes.
 * @param change The MoveChange event.
 */
function handleMoveChange(nodeIdToNode: Record<string, TreeNode>, change: MoveChange): void {
  const sourceParentNode = nodeIdToNode[change.previous_parent_id]
  const destinationParentNode = nodeIdToNode[change.new_parent_id]
  if (!sourceParentNode) {
    throw new Error(`Source parent node with id ${change.previous_parent_id} not found`)
  }
  if (!destinationParentNode) {
    throw new Error(`Destination parent node with id ${change.new_parent_id} not found`)
  }

  // Find the node to move
  const nodeIndex = sourceParentNode.children.findIndex(child => child.id === change.node_id)
  if (nodeIndex === -1) {
    throw new Error(`Node with id ${change.node_id} not found under parent ${change.previous_parent_id}`)
  }
  const [nodeToMove] = sourceParentNode.children.splice(nodeIndex, 1)

  // Update the path based on the new parent
  const newPath = destinationParentNode.path ? `${destinationParentNode.path}/${nodeToMove.name}` : nodeToMove.name
  nodeToMove.path = newPath
  // Update paths of all descendants if it's a folder
  if (!nodeToMove.is_file && nodeToMove.children.length > 0) {
    updateChildPaths(nodeToMove)
  }

  // Add the node to the new parent
  destinationParentNode.addChild(nodeToMove)
}

/**
 * Recursively updates the paths of all child nodes based on their new parent path.
 * @param parentNode The TreeNode whose children need to have updated paths.
 */
function updateChildPaths(parentNode: TreeNode): void {
  parentNode.children.forEach(child => {
    child.path = `${parentNode.path}/${child.name}`
    if (!child.is_file && child.children.length > 0) {
      updateChildPaths(child)
    }
  })
}

/**
 * Finds a file node by its path within a list of nodes.
 * @param nodes The list of TreeNodes to search within.
 * @param path The path of the file to find.
 * @returns The TreeNode if found, otherwise null.
 */
export function findFileByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node
    }
    if (!node.is_file && node.children.length > 0) {
      const found = findFileByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}