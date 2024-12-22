import { reactive } from 'vue'

/**
 * Represents a node in the file explorer tree.
 */
export class TreeNode {
  name: string
  path: string
  is_file: boolean
  children: TreeNode[]
  id: string

  /**
   * Creates a new TreeNode.
   * @param name The name of the file or folder.
   * @param path The full path of the file or folder.
   * @param is_file Indicates if the node is a file.
   * @param children Child nodes (only for folders).
   * @param id Unique identifier for the node.
   */
  constructor(
    name: string,
    path: string,
    is_file: boolean = false,
    children: TreeNode[] = [],
    id: string = ''
  ) {
    this.name = name
    this.path = path
    this.is_file = is_file
    this.children = children
    this.id = id
  }

  /**
   * Creates a TreeNode from a plain object.
   * @param obj The object representing the node.
   * @returns A TreeNode instance.
   */
  static fromObject(obj: any): TreeNode {
    const children = obj.children
      ? obj.children.map((child: any) => TreeNode.fromObject(child))
      : []
    return new TreeNode(obj.name, obj.path, obj.is_file, children, obj.id || generateUniqueId())
  }

  /**
   * Adds a child node to this node.
   * @param node The TreeNode to add as a child.
   */
  addChild(node: TreeNode): void {
    this.children.push(node)
  }
}

/**
 * Generates a unique identifier for a node.
 * @returns A unique string ID.
 */
function generateUniqueId(): string {
  return 'id-' + Math.random().toString(36).substr(2, 16)
}

/**
 * Converts a JSON string to a TreeNode.
 * @param json The JSON string representing the tree structure.
 * @returns The root TreeNode.
 */
export function convertJsonToTreeNode(json: string): TreeNode {
  const obj = JSON.parse(json)
  return TreeNode.fromObject(obj)
}