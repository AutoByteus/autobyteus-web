import { reactive } from 'vue'

export class TreeNode {
  name: string
  path: string
  is_file: boolean
  children: TreeNode[]
  id: string

  constructor(name: string, path: string, is_file: boolean = false, children: TreeNode[] = [], id: string = '') {
    this.name = name
    this.path = path
    this.is_file = is_file
    this.children = children
    this.id = id
  }

  static fromObject(obj: any): TreeNode {
    const children = obj.children ? obj.children.map((child: any) => TreeNode.fromObject(child)) : []
    return new TreeNode(obj.name, obj.path, obj.is_file, children, obj.id || '')
  }

  addChild(node: TreeNode): void {
    this.children.push(node)
  }
}

export function convertJsonToTreeNode(json: string): TreeNode {
  const obj = JSON.parse(json)
  return TreeNode.fromObject(obj)
}