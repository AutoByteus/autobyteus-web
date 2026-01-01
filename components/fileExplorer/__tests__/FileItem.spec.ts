import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import FileItem from '../FileItem.vue'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useWorkspaceStore } from '~/stores/workspace'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('FileItem - Lazy Loading', () => {
  const createMockFolder = (childrenLoaded: boolean = false): TreeNode => {
    return new TreeNode(
      'test-folder',
      'root/test-folder',
      false, // is_file
      [],    // children
      'folder-id',
      childrenLoaded
    )
  }

  const createMockFile = (): TreeNode => {
    return new TreeNode(
      'test-file.txt',
      'root/test-file.txt',
      true, // is_file
      [],
      'file-id'
    )
  }

  const createMockPreviewableFile = (): TreeNode => {
    return new TreeNode(
      'README.md',
      'root/README.md',
      true, // is_file
      [],
      'preview-file-id'
    )
  }

  const mountComponent = async (file: TreeNode) => {
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
    setActivePinia(pinia)

    const fileExplorerStore = useFileExplorerStore()
    const workspaceStore = useWorkspaceStore()

    // Mock the activeWorkspace getter
    Object.defineProperty(workspaceStore, 'activeWorkspace', {
      get: () => ({
        workspaceId: 'test-workspace-id',
        name: 'Test Workspace',
        fileExplorer: new TreeNode('root', 'root', false, [], 'root-id', true),
        nodeIdToNode: {},
        workspaceConfig: {},
        absolutePath: '/test/path'
      }),
      configurable: true
    })

    // Mock isFolderOpen to return false initially (folder is closed)
    Object.defineProperty(fileExplorerStore, 'isFolderOpen', {
        value: vi.fn().mockReturnValue(false),
        writable: true
    })

    const wrapper = mount(FileItem, {
      props: { file },
      global: {
        plugins: [pinia],
        stubs: {
          // Stub child components to avoid deep rendering issues
          FileContextMenu: true,
          ConfirmDeleteDialog: true,
          AddFileOrFolderDialog: true,
        }
      },
    })

    await flushPromises()
    return { wrapper, fileExplorerStore, workspaceStore }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should trigger fetchFolderChildren when expanding unloaded folder', async () => {
    const unloadedFolder = createMockFolder(false) // childrenLoaded = false
    const { wrapper, fileExplorerStore, workspaceStore } = await mountComponent(unloadedFolder)

    // Simulate folder will be open after click
    ;(fileExplorerStore as any).isFolderOpen = vi.fn().mockReturnValue(true)

    // Click on the file item (folder)
    const fileHeader = wrapper.find('.file-header')
    await fileHeader.trigger('click')
    await flushPromises()

    // Verify toggleFolder was called
    expect(fileExplorerStore.toggleFolder).toHaveBeenCalledWith('root/test-folder')

    // Verify fetchFolderChildren was called because folder wasn't loaded
    expect(workspaceStore.fetchFolderChildren).toHaveBeenCalledWith(
      'test-workspace-id',
      'root/test-folder'
    )
  })

  it('should NOT trigger fetchFolderChildren when expanding already-loaded folder', async () => {
    const loadedFolder = createMockFolder(true) // childrenLoaded = true
    const { wrapper, fileExplorerStore, workspaceStore } = await mountComponent(loadedFolder)

    // Simulate folder will be open after click  
    ;(fileExplorerStore as any).isFolderOpen = vi.fn().mockReturnValue(true)

    // Click on the file item
    const fileHeader = wrapper.find('.file-header')
    await fileHeader.trigger('click')
    await flushPromises()

    // Verify toggleFolder was called
    expect(fileExplorerStore.toggleFolder).toHaveBeenCalledWith('root/test-folder')

    // fetchFolderChildren should NOT be called since folder is already loaded
    expect(workspaceStore.fetchFolderChildren).not.toHaveBeenCalled()
  })

  it('should NOT trigger fetchFolderChildren when collapsing a folder', async () => {
    const unloadedFolder = createMockFolder(false)
    const { wrapper, fileExplorerStore, workspaceStore } = await mountComponent(unloadedFolder)

    // Simulate folder will be CLOSED after click (collapsing)
    ;(fileExplorerStore as any).isFolderOpen = vi.fn().mockReturnValue(false)

    // Click on the file item
    const fileHeader = wrapper.find('.file-header')
    await fileHeader.trigger('click')
    await flushPromises()

    // toggleFolder should be called
    expect(fileExplorerStore.toggleFolder).toHaveBeenCalled()

    // fetchFolderChildren should NOT be called when collapsing
    expect(workspaceStore.fetchFolderChildren).not.toHaveBeenCalled()
  })

  it('should open file instead of fetching children when clicking a file', async () => {
    const file = createMockFile()
    const { wrapper, fileExplorerStore, workspaceStore } = await mountComponent(file)

    // Click on the file item
    const fileHeader = wrapper.find('.file-header')
    await fileHeader.trigger('click')
    await flushPromises()

    // openFile should be called, not toggleFolder
    expect(fileExplorerStore.openFile).toHaveBeenCalledWith('root/test-file.txt')
    expect(fileExplorerStore.toggleFolder).not.toHaveBeenCalled()
    expect(workspaceStore.fetchFolderChildren).not.toHaveBeenCalled()
  })

  it('should open file in preview mode when clicking a previewable file', async () => {
    const file = createMockPreviewableFile()
    const { wrapper, fileExplorerStore } = await mountComponent(file)

    await wrapper.find('.file-header').trigger('click')
    await flushPromises()

    expect(fileExplorerStore.openFilePreview).toHaveBeenCalledWith('root/README.md')
    expect(fileExplorerStore.openFile).not.toHaveBeenCalled()
  })
})
