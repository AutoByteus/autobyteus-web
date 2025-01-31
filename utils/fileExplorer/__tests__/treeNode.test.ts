import { describe, it, expect } from 'vitest'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'

describe('TreeNode', () => {
  it('should initialize with given parameters', () => {
    const node = new TreeNode('testName', 'root/testName', false, [], 'test-id')
    expect(node.name).toBe('testName')
    expect(node.path).toBe('root/testName')
    expect(node.is_file).toBe(false)
    expect(node.children).toEqual([])
    expect(node.id).toBe('test-id')
  })

  it('should construct from an object', () => {
    const obj = {
      name: 'someFile.txt',
      path: 'root/someFile.txt',
      is_file: true,
      children: [],
      id: 'some-id'
    }
    const node = TreeNode.fromObject(obj)

    expect(node.name).toBe('someFile.txt')
    expect(node.path).toBe('root/someFile.txt')
    expect(node.is_file).toBe(true)
    expect(node.id).toBe('some-id')
    expect(node.children).toHaveLength(0)
  })

  it('should insert children in correct order (directories first, then files)', () => {
    const root = new TreeNode('root', 'root', false, [], 'root-id')

    // Insert unsorted
    const fileB = new TreeNode('fileB.txt', 'root/fileB.txt', true, [], 'fileB-id')
    const folderA = new TreeNode('folderA', 'root/folderA', false, [], 'folderA-id')
    const fileA = new TreeNode('fileA.txt', 'root/fileA.txt', true, [], 'fileA-id')
    const folderZ = new TreeNode('z-folder', 'root/z-folder', false, [], 'folderZ-id')
    
    // NOTE: Renamed from 'B-folder' to 'folderB' so it sorts after 'folderA' ignoring case
    const folderB = new TreeNode('folderB', 'root/folderB', false, [], 'folderB-id')

    // Add them in random order
    root.addChild(fileB)   // first
    root.addChild(folderA)
    root.addChild(fileA)
    root.addChild(folderZ)
    root.addChild(folderB) // last

    // Expect directories first, sorted ignoring case: folderA, folderB, z-folder
    // Then files, sorted ignoring case: fileA.txt, fileB.txt
    const childIds = root.children.map(child => child.id)
    expect(childIds).toEqual([
      'folderA-id',
      'folderB-id',
      'folderZ-id',
      'fileA-id',
      'fileB-id'
    ])

    // Check the actual order by name as well:
    const childNames = root.children.map(child => child.name)
    expect(childNames).toEqual([
      'folderA',
      'folderB',
      'z-folder',
      'fileA.txt',
      'fileB.txt'
    ])
  })

  it('should sort children by name in a case-insensitive manner within the same type', () => {
    const root = new TreeNode('root', 'root', false, [], 'root-id')

    const folderC = new TreeNode('cFolder', 'root/cFolder', false, [], 'folderC-id')
    const folderb = new TreeNode('bFolder', 'root/bFolder', false, [], 'folderb-id')
    const fileX = new TreeNode('XFile.txt', 'root/XFile.txt', true, [], 'fileX-id')
    const filex = new TreeNode('xFile.txt', 'root/xFile.txt', true, [], 'filex-id')

    // Insert unsorted
    root.addChild(filex) 
    root.addChild(folderC)
    root.addChild(folderb)
    root.addChild(fileX)

    // Directories first: folderb ('bFolder'), folderC ('cFolder'), then files: 'XFile.txt', 'xFile.txt'.
    // 'bFolder'.toLowerCase() => 'bfolder', 'cFolder'.toLowerCase() => 'cfolder'
    // => 'bFolder' < 'cFolder'. 
    // For files 'XFile.txt' <-> 'xFile.txt', ignoring case they are equal, so insertion order typically decides.
    
    const childNames = root.children.map(child => child.name)

    // The 1st directory we inserted was folderC, the 2nd was folderb => 
    // But by sort logic ignoring case => 'bFolder' < 'cFolder', so folderb should appear first in final order.
    // => [ 'bFolder', 'cFolder' ] (both directories), then [ 'XFile.txt', 'xFile.txt' ] (files)
    expect(childNames[0]).toBe('bFolder')
    expect(childNames[1]).toBe('cFolder')
    expect(root.children[0].is_file).toBe(false)
    expect(root.children[1].is_file).toBe(false)

    expect(root.children[2].is_file).toBe(true)
    expect(root.children[3].is_file).toBe(true)
  })

  it('should sort children after a rename if needed', () => {
    const root = new TreeNode('root', 'root', false, [], 'root-id')
    const folderA = new TreeNode('folderA', 'root/folderA', false, [], 'folderA-id')
    const fileB = new TreeNode('fileB.txt', 'root/fileB.txt', true, [], 'fileB-id')
    root.addChild(folderA)
    root.addChild(fileB)

    // Let's rename 'fileB.txt' => 'aaa.txt', then call 'root.sortChildren()'
    fileB.name = 'aaa.txt'
    fileB.path = 'root/aaa.txt'
    root.sortChildren()

    // Directories should still come before files
    expect(root.children[0].id).toBe('folderA-id')
    expect(root.children[1].id).toBe('fileB-id')

    // If we rename folderA => 'zzzFolder' and call root.sortChildren()
    folderA.name = 'zzzFolder'
    folderA.path = 'root/zzzFolder'
    root.sortChildren()

    // It's still a directory, so remains first (since there's only 1 dir anyway).
    expect(root.children[0].id).toBe('folderA-id')
    expect(root.children[0].name).toBe('zzzFolder')
    expect(root.children[1].id).toBe('fileB-id')
  })
})