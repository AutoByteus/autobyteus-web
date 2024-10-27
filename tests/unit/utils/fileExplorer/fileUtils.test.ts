import { describe, it, expect, beforeEach } from 'vitest'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import { getFilePathsFromFolder, determineFileType, findNodeById, createNodeIdToNodeDictionary, handleFileSystemChange } from '~/utils/fileExplorer/fileUtils'
import type { FileSystemChangeEvent, AddChange, DeleteChange, RenameChange } from '~/types/fileSystemChangeTypes'

describe('fileUtils', () => {
  let rootNode: TreeNode

  beforeEach(() => {
    // Set up a sample tree
    rootNode = new TreeNode('root', 'root', false, [], 'root-id')

    const folderA = new TreeNode('folderA', 'root/folderA', false, [], 'folderA-id')
    const file1 = new TreeNode('file1.txt', 'root/file1.txt', true, [], 'file1-id')
    const file2 = new TreeNode('file2.txt', 'root/folderA/file2.txt', true, [], 'file2-id')

    rootNode.addChild(folderA)
    rootNode.addChild(file1)
    folderA.addChild(file2)
  })

  describe('getFilePathsFromFolder', () => {
    it('should return all file paths from the tree', () => {
      const filePaths = getFilePathsFromFolder(rootNode)
      expect(filePaths).toContain('root/file1.txt')
      expect(filePaths).toContain('root/folderA/file2.txt')
      expect(filePaths).toHaveLength(2)
    })
  })

  describe('determineFileType', () => {
    it('should determine file type as image for image files', async () => {
      const fileType = await determineFileType('image.jpg')
      expect(fileType).toBe('image')
    })

    it('should determine file type as text for text files', async () => {
      const fileType = await determineFileType('document.txt')
      expect(fileType).toBe('text')
    })

    it('should be case-insensitive', async () => {
      const fileType = await determineFileType('PHOTO.PNG')
      expect(fileType).toBe('image')
    })
  })

  describe('findNodeById', () => {
    it('should find a node by its id', () => {
      const node = findNodeById(rootNode, 'file1-id')
      expect(node).toBeDefined()
      expect(node?.name).toBe('file1.txt')
    })

    it('should return null if node is not found', () => {
      const node = findNodeById(rootNode, 'non-existent-id')
      expect(node).toBeNull()
    })
  })

  describe('createNodeIdToNodeDictionary', () => {
    it('should create a dictionary mapping node ids to nodes', () => {
      const dict = createNodeIdToNodeDictionary(rootNode)
      expect(Object.keys(dict)).toHaveLength(4)
      expect(dict['root-id']).toBe(rootNode)
      expect(dict['folderA-id']).toBe(rootNode.children[0])
      expect(dict['file1-id']).toBe(rootNode.children[1])
      expect(dict['file2-id']).toBe(rootNode.children[0].children[0])
    })
  })

  describe('handleFileSystemChange', () => {
    let nodeIdToNode: Record<string, TreeNode>

    beforeEach(() => {
      nodeIdToNode = createNodeIdToNodeDictionary(rootNode)
    })

    it('should handle add change', () => {
      const newFile = new TreeNode('newFile.txt', 'root/newFile.txt', true, [], 'newFile-id')
      const addChange: AddChange = {
        type: 'add',
        node: newFile,
        parent_id: 'root-id'
      }
      const event: FileSystemChangeEvent = { changes: [addChange] }

      handleFileSystemChange(rootNode, nodeIdToNode, event)

      expect(nodeIdToNode['newFile-id']).toBeDefined()
      expect(rootNode.children.find(child => child.id === 'newFile-id')).toBeDefined()
    })

    it('should handle delete change', () => {
      const deleteChange: DeleteChange = {
        type: 'delete',
        node_id: 'file1-id',
        parent_id: 'root-id'
      }
      const event: FileSystemChangeEvent = { changes: [deleteChange] }

      handleFileSystemChange(rootNode, nodeIdToNode, event)

      expect(nodeIdToNode['file1-id']).toBeUndefined()
      expect(rootNode.children.find(child => child.id === 'file1-id')).toBeUndefined()
    })

    it('should handle rename change', () => {
      const renamedNode = new TreeNode('renamedFile.txt', 'root/renamedFile.txt', true, [], 'file1-id')
      const renameChange: RenameChange = {
        type: 'rename',
        node: renamedNode,
        previous_id: 'file1-id'
      }
      const event: FileSystemChangeEvent = { changes: [renameChange] }

      handleFileSystemChange(rootNode, nodeIdToNode, event)

      expect(nodeIdToNode['file1-id']).toBeDefined()
      expect(nodeIdToNode['file1-id'].name).toBe('renamedFile.txt')
      expect(nodeIdToNode['file1-id'].path).toBe('root/renamedFile.txt')
    })

    it('should handle multiple changes', () => {
      const newFolder = new TreeNode('newFolder', 'root/newFolder', false, [], 'newFolder-id')
      const newFileInFolder = new TreeNode('newFile.txt', 'root/newFolder/newFile.txt', true, [], 'newFileInFolder-id')

      const addFolderChange: AddChange = {
        type: 'add',
        node: newFolder,
        parent_id: 'root-id'
      }

      const addFileChange: AddChange = {
        type: 'add',
        node: newFileInFolder,
        parent_id: 'newFolder-id'
      }

      const event: FileSystemChangeEvent = { changes: [addFolderChange, addFileChange] }

      handleFileSystemChange(rootNode, nodeIdToNode, event)

      expect(nodeIdToNode['newFolder-id']).toBeDefined()
      expect(nodeIdToNode['newFileInFolder-id']).toBeDefined()
      expect(nodeIdToNode['newFolder-id'].children.find(child => child.id === 'newFileInFolder-id')).toBeDefined()
    })

    it('should handle add change when parent does not exist', () => {
      // Simulate a case where the parent node does not exist
      const newFolder = new TreeNode('nonExistentFolder', 'root/nonExistentFolder', false, [], 'nonExistentFolder-id')
      const newFile = new TreeNode('newFile.txt', 'root/nonExistentFolder/newFile.txt', true, [], 'newFile-id')
      
      const addFolderChange: AddChange = {
        type: 'add',
        node: newFolder,
        parent_id: 'root-id'
      }
      const addFileChange: AddChange = {
        type: 'add',
        node: newFile,
        parent_id: 'nonExistentFolder-id'
      }

      const event: FileSystemChangeEvent = { changes: [addFolderChange, addFileChange] }

      handleFileSystemChange(rootNode, nodeIdToNode, event)

      expect(nodeIdToNode['nonExistentFolder-id']).toBeDefined()
      expect(nodeIdToNode['newFile-id']).toBeDefined()
      expect(nodeIdToNode['nonExistentFolder-id'].children.find(child => child.id === 'newFile-id')).toBeDefined()
    })
  })
})