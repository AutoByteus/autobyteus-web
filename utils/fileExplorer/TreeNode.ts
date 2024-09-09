export class TreeNode {
    name: string
    path: string
    is_file: boolean
    children: TreeNode[]
  
    constructor(name: string, path: string, is_file: boolean = false, children: TreeNode[] = []) {
      this.name = name
      this.path = path
      this.is_file = is_file
      this.children = children
    }
  
    static fromObject(obj: any): TreeNode {
      const children = obj.children ? obj.children.map((child: any) => TreeNode.fromObject(child)) : []
      return new TreeNode(obj.name, obj.path, obj.is_file, children)
    }
  }
  
  export function convertJsonToTreeNode(json: string): TreeNode {
    const obj = JSON.parse(json)
    return TreeNode.fromObject(obj)
  }