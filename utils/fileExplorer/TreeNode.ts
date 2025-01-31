export class TreeNode {
  name: string
  path: string
  is_file: boolean
  children: TreeNode[]
  id: string

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

  static fromObject(obj: any): TreeNode {
    const children = obj.children
      ? obj.children.map((child: any) => TreeNode.fromObject(child))
      : []
    return new TreeNode(
      obj.name,
      obj.path,
      obj.is_file,
      children,
      obj.id || ''
    )
  }

  /**
   * Adds a child in a sorted position, avoiding a full re-sort of `children`.
   * The ordering rule is:
   *   1) Directories (is_file=false) come before files (is_file=true).
   *   2) Among directories (or among files), sort by name ignoring case.
   */
  addChild(node: TreeNode): void {
    // Insert using our custom binary search approach
    const insertIndex = this.findInsertIndex(node)
    this.children.splice(insertIndex, 0, node)
  }

  /**
   * A helper method to find the correct insertion index for `node`
   * via binary search, based on the comparison logic:
   *
   *  1) Directories before files
   *  2) Among directories or among files, compare by lowercase name
   */
  private findInsertIndex(node: TreeNode): number {
    let low = 0
    let high = this.children.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (this.compareNodes(node, this.children[mid]) < 0) {
        high = mid
      } else {
        low = mid + 1
      }
    }
    return low
  }

  /**
   * Compare function that ensures directories appear first,
   * then files, then name-based comparison ignoring case.
   */
  private compareNodes(a: TreeNode, b: TreeNode): number {
    // If a is directory and b is file => a < b
    if (a.is_file !== b.is_file) {
      return a.is_file ? 1 : -1
    }
    // Both are dirs or both are files => compare by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  }

  /**
   * Re-sorts the entire children array (used if something changed
   * that might break ordering, e.g. node rename). Typically you won't
   * need this if you do a binary search insert for new children, but
   * you may call it after a rename or other operation that changes ordering.
   */
  sortChildren(): void {
    this.children.sort((a, b) => this.compareNodes(a, b))
  }
}

export function convertJsonToTreeNode(json: string): TreeNode {
  const obj = JSON.parse(json)
  return TreeNode.fromObject(obj)
}
