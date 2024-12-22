// File: autobyteus-web/types/fileSystemChangeTypes.ts
import { TreeNode } from '~/utils/fileExplorer/TreeNode'

export interface FileSystemChangeEvent {
  changes: Array<AddChange | DeleteChange | RenameChange | MoveChange>
}

export interface AddChange {
  type: 'add'
  node: TreeNode // Replace 'any' with 'TreeNode' for type safety
  parent_id: string
}

export interface DeleteChange {
  type: 'delete'
  node_id: string
  parent_id: string
}

export interface RenameChange {
  type: 'rename'
  node: TreeNode // Replace 'any' with 'TreeNode' for type safety
  previous_id?: string
}

export interface MoveChange {
  type: 'move'
  node_id: string
  previous_parent_id: string
  new_parent_id: string
}
