import { defineStore } from 'pinia'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GetFileContent, SearchFiles } from '~/graphql/queries/file_explorer_queries'
import { ApplyFileChange, RenameFile, DeleteFile, MoveFile } from '~/graphql/mutations/file_explorer_mutations'
import type { 
  GetFileContentQuery, 
  GetFileContentQueryVariables, 
  ApplyFileChangeMutation, 
  ApplyFileChangeMutationVariables,
  SearchFilesQuery,
  SearchFilesQueryVariables,
  RenameFileMutation,
  RenameFileMutationVariables,
  DeleteFileMutation,
  DeleteFileMutationVariables,
  MoveFileMutation,
  MoveFileMutationVariables,
} from '~/generated/graphql'
import { useWorkspaceStore } from '~/stores/workspace'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import { findFileByPath } from '~/utils/fileExplorer/fileUtils'

interface FileExplorerState {
  openFolders: Record<string, boolean>;
  openFiles: string[];
  activeFile: string | null;
  fileContents: Map<string, string>;
  contentLoading: Record<string, boolean>;
  contentError: Record<string, string | null>;
  applyChangeError: Record<string, Record<number, Record<string, string | null>>>;
  applyChangeLoading: Record<string, Record<number, Record<string, boolean>>>;
  appliedChanges: Record<string, Record<number, Record<string, boolean>>>;
  searchResults: any[];
  searchLoading: boolean;
  searchError: string | null;
  workspaceId: string; // Added workspaceId to manage current workspace
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
    appliedChanges: {},
    searchResults: [],
    searchLoading: false,
    searchError: null,
    workspaceId: '', // Initialize workspaceId
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
      delete this.appliedChanges[filePath]
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
      this.workspaceId = workspaceId // Set workspaceId

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
          
          // Mark the change as applied
          if (!this.appliedChanges[conversationId]) {
            this.appliedChanges[conversationId] = {}
          }
          if (!this.appliedChanges[conversationId][messageIndex]) {
            this.appliedChanges[conversationId][messageIndex] = {}
          }
          this.appliedChanges[conversationId][messageIndex][filePath] = true
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
    async renameFile(
      workspaceId: string,
      filePath: string,
      newName: string
    ): Promise<boolean> {
      const { mutate } = useMutation<RenameFileMutation, RenameFileMutationVariables>(RenameFile)
      try {
        const result = await mutate({ workspaceId, filePath, newName })
        if (result?.data?.renameFile) {
          const workspaceStore = useWorkspaceStore()
          await workspaceStore.refreshWorkspace() // Refresh the workspace tree
          return true
        }
        return false
      } catch (error: any) {
        console.error('Failed to rename file:', error)
        throw new Error(error.message || 'Failed to rename file')
      }
    },
    async deleteFile(
      workspaceId: string,
      filePath: string
    ): Promise<boolean> {
      const { mutate } = useMutation<DeleteFileMutation, DeleteFileMutationVariables>(DeleteFile)
      try {
        const result = await mutate({ workspaceId, filePath })
        if (result?.data?.deleteFile) {
          const workspaceStore = useWorkspaceStore()
          await workspaceStore.refreshWorkspace() // Refresh the workspace tree
          // If the deleted file is open, close it
          if (this.openFiles.includes(filePath)) {
            this.closeFile(filePath)
          }
          return true
        }
        return false
      } catch (error: any) {
        console.error('Failed to delete file:', error)
        throw new Error(error.message || 'Failed to delete file')
      }
    },
    async moveFile(
      workspaceId: string,
      sourcePath: string,
      destinationPath: string
    ): Promise<boolean> {
      const { mutate } = useMutation<MoveFileMutation, MoveFileMutationVariables>(MoveFile)
      try {
        const result = await mutate({ workspaceId, sourcePath, destinationPath })
        if (result?.data?.moveFile) {
          const workspaceStore = useWorkspaceStore()
          await workspaceStore.refreshWorkspace() // Refresh the workspace tree
          // If the moved file is open, update its path in openFiles
          if (this.openFiles.includes(sourcePath)) {
            this.openFiles = this.openFiles.map(file => file === sourcePath ? destinationPath : file)
            this.fileContents.set(destinationPath, this.fileContents.get(sourcePath) || '')
            this.fileContents.delete(sourcePath)
            if (this.activeFile === sourcePath) {
              this.activeFile = destinationPath
            }
          }
          return true
        }
        return false
      } catch (error: any) {
        console.error('Failed to move file:', error)
        throw new Error(error.message || 'Failed to move file')
      }
    },
    isApplyChangeInProgress(conversationId: string, messageIndex: number, filePath: string): boolean {
      return !!(this.applyChangeLoading[conversationId] &&
        this.applyChangeLoading[conversationId][messageIndex] &&
        this.applyChangeLoading[conversationId][messageIndex][filePath])
    },
    isChangeApplied(conversationId: string, messageIndex: number, filePath: string): boolean {
      return this.appliedChanges[conversationId]?.[messageIndex]?.[filePath] || false
    },
    getApplyChangeError(conversationId: string, messageIndex: number, filePath: string): string | null {
      return this.applyChangeError[conversationId]?.[messageIndex]?.[filePath] || null
    },
    async searchFiles(query: string) {
      this.searchLoading = true
      this.searchError = null
      this.searchResults = []

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId
      this.workspaceId = workspaceId // Set workspaceId

      if (!query) {
        // If query is empty, show top-level files and folders
        this.searchResults = workspaceStore.currentWorkspaceTree?.children || []
        this.searchLoading = false
        return
      }

      const { onResult, onError } = useQuery<SearchFilesQuery, SearchFilesQueryVariables>(
        SearchFiles,
        { workspaceId, query }
      )

      onResult((result) => {
        if (result.data?.searchFiles) {
          const matchedPaths = result.data.searchFiles
          this.searchResults = matchedPaths.map(path => {
            return findFileByPath(workspaceStore.currentWorkspaceTree?.children || [], path)
          }).filter(file => file !== null)
        }
        this.searchLoading = false
      })

      onError((error) => {
        console.error('Error searching files:', error)
        this.searchError = error.message
        this.searchLoading = false
      })
    },
    resetState() {
      this.openFolders = {}
      this.openFiles = []
      this.activeFile = null
      this.fileContents.clear()
      this.contentLoading = {}
      this.contentError = {}
      this.applyChangeError = {}
      this.applyChangeLoading = {}
      this.appliedChanges = {}
      this.searchResults = []
      this.searchLoading = false
      this.searchError = null
      this.workspaceId = ''
    }
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
    isChangeAppliedGetter: (state) => (conversationId: string, messageIndex: number, filePath: string): boolean => {
      return state.appliedChanges[conversationId]?.[messageIndex]?.[filePath] || false
    },
    getApplyChangeErrorGetter: (state) => (conversationId: string, messageIndex: number, filePath: string): string | null => {
      return state.applyChangeError[conversationId]?.[messageIndex]?.[filePath] || null
    },
    getSearchResults: (state) => state.searchResults,
    isSearchLoading: (state) => state.searchLoading,
    getSearchError: (state) => state.searchError,
  }
})
