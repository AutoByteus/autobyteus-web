import { defineStore } from 'pinia'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GetFileContent } from '~/graphql/queries/file_explorer_queries'
import { ApplyFileChange } from '~/graphql/mutations/file_explorer_mutations'
import type { 
  GetFileContentQuery, 
  GetFileContentQueryVariables, 
  ApplyFileChangeMutation, 
  ApplyFileChangeMutationVariables,
} from '~/generated/graphql'
import { useWorkspaceStore } from '~/stores/workspace'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import Fuse from 'fuse.js'

interface FileExplorerState {
  openFolders: Record<string, boolean>;
  openFiles: string[];
  activeFile: string | null;
  fileContents: Map<string, string>;
  contentLoading: Record<string, boolean>;
  contentError: Record<string, string | null>;
  applyChangeError: Record<string, Record<number, Record<string, string | null>>>;
  applyChangeLoading: Record<string, Record<number, Record<string, boolean>>>;
  fuse?: Fuse<{ name: string; path: string }>;
}

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerState => ({
    openFolders: {},
    openFiles: [],
    activeFile: null,
    fileContents: new Map(),
    contentLoading: {},
    contentError: {},
    applyChangeError: {},
    applyChangeLoading: {},
    fuse: undefined,
  }),
  actions: {
    toggleFolder(folderPath: string) {
      this.openFolders[folderPath] = !this.openFolders[folderPath]
    },
    openFile(filePath: string) {
      if (!this.openFiles.includes(filePath)) {
        this.openFiles.push(filePath)
        this.fetchFileContent(filePath)
      }
      this.activeFile = filePath
    },
    closeFile(filePath: string) {
      this.openFiles = this.openFiles.filter(file => file !== filePath)
      this.fileContents.delete(filePath)
      delete this.contentLoading[filePath]
      delete this.contentError[filePath]
      if (this.activeFile === filePath) {
        this.activeFile = this.openFiles[this.openFiles.length - 1] || null
      }
    },
    setActiveFile(filePath: string) {
      if (this.openFiles.includes(filePath)) {
        this.activeFile = filePath
      }
    },
    fetchFileContent(filePath: string) {
      if (this.fileContents.has(filePath)) return

      this.contentLoading[filePath] = true
      this.contentError[filePath] = null

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId

      const { onResult, onError } = useQuery<GetFileContentQuery, GetFileContentQueryVariables>(
        GetFileContent,
        { workspaceId, filePath }
      )
      onResult((result) => {
        if (result.data?.fileContent) {
          this.fileContents.set(filePath, result.data.fileContent)
          this.contentLoading[filePath] = false
        }
      })

      onError((error) => {
        console.error('Failed to fetch file content', error)
        this.contentError[filePath] = error.message
        this.contentLoading[filePath] = false
      })
    },
    async applyFileChange(
      workspaceId: string,
      filePath: string,
      content: string,
      conversationId: string,
      messageIndex: number
    ) {
      if (!this.applyChangeError[conversationId]) {
        this.applyChangeError[conversationId] = {}
      }
      if (!this.applyChangeError[conversationId][messageIndex]) {
        this.applyChangeError[conversationId][messageIndex] = {}
      }
      if (!this.applyChangeLoading[conversationId]) {
        this.applyChangeLoading[conversationId] = {}
      }
      if (!this.applyChangeLoading[conversationId][messageIndex]) {
        this.applyChangeLoading[conversationId][messageIndex] = {}
      }

      this.applyChangeError[conversationId][messageIndex][filePath] = null
      this.applyChangeLoading[conversationId][messageIndex][filePath] = true

      const { mutate } = useMutation<ApplyFileChangeMutation, ApplyFileChangeMutationVariables>(ApplyFileChange)

      try {
        const result = await mutate({ workspaceId, filePath, content })
        
        if (result?.data?.applyFileChange) {
          this.fileContents.set(filePath, content)
          console.log('File change applied successfully')
          // Process the change event
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.applyFileChange)
          const workspaceStore = useWorkspaceStore()
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.applyChangeLoading[conversationId][messageIndex][filePath] = false
        return result
      } catch (err) {
        console.error('Failed to apply file change:', err)
        this.applyChangeError[conversationId][messageIndex][filePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.applyChangeLoading[conversationId][messageIndex][filePath] = false
        throw err
      }
    },
    isApplyChangeInProgress(conversationId: string, messageIndex: number, filePath: string): boolean {
      return !!(this.applyChangeLoading[conversationId] &&
        this.applyChangeLoading[conversationId][messageIndex] &&
        this.applyChangeLoading[conversationId][messageIndex][filePath])
    },
    getApplyChangeError(conversationId: string, messageIndex: number, filePath: string): string | null {
      return this.applyChangeError[conversationId]?.[messageIndex]?.[filePath] || null
    },
    setApplyChangeLoading(conversationId: string, messageIndex: number, filePath: string, isLoading: boolean) {
      if (!this.applyChangeLoading[conversationId]) {
        this.applyChangeLoading[conversationId] = {}
      }
      if (!this.applyChangeLoading[conversationId][messageIndex]) {
        this.applyChangeLoading[conversationId][messageIndex] = {}
      }
      this.applyChangeLoading[conversationId][messageIndex][filePath] = isLoading
    },
    setApplyChangeError(conversationId: string, messageIndex: number, filePath: string, error: string | null) {
      if (!this.applyChangeError[conversationId]) {
        this.applyChangeError[conversationId] = {}
      }
      if (!this.applyChangeError[conversationId][messageIndex]) {
        this.applyChangeError[conversationId][messageIndex] = {}
      }
      this.applyChangeError[conversationId][messageIndex][filePath] = error
    },
    initializeFuse(flattenedFiles: Array<{ name: string; path: string }>) {
      this.fuse = new Fuse(flattenedFiles, {
        keys: ['name', 'path'],
        includeScore: true,
        threshold: 0.3,
      })
    },
    updateFuseCollection(flattenedFiles: Array<{ name: string; path: string }>) {
      if (this.fuse) {
        this.fuse.setCollection(flattenedFiles)
      } else {
        this.initializeFuse(flattenedFiles)
      }
    },
  },
  getters: {
    isFolderOpen: (state) => (folderPath: string): boolean => !!state.openFolders[folderPath],
    allOpenFolders: (state): string[] => Object.keys(state.openFolders).filter(folder => state.openFolders[folder]),
    getOpenFiles: (state): string[] => state.openFiles,
    getActiveFile: (state): string | null => state.activeFile,
    getFileContent: (state) => (filePath: string): string | null => state.fileContents.get(filePath) || null,
    isContentLoading: (state) => (filePath: string): boolean => !!state.contentLoading[filePath],
    getContentError: (state) => (filePath: string): string | null => state.contentError[filePath] || null,
    isApplyChangeInProgressGetter: (state) => (conversationId: string, messageIndex: number, filePath: string): boolean => {
      return !!(state.applyChangeLoading[conversationId] &&
        state.applyChangeLoading[conversationId][messageIndex] &&
        state.applyChangeLoading[conversationId][messageIndex][filePath])
    },
    getApplyChangeErrorGetter: (state) => (conversationId: string, messageIndex: number, filePath: string): string | null => {
      return state.applyChangeError[conversationId]?.[messageIndex]?.[filePath] || null
    },
    fuseInstance: (state) => state.fuse,
  }
})