import { defineStore } from 'pinia'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GetFileContent, SearchFiles } from '~/graphql/queries/file_explorer_queries'
import { ApplyFileChange } from '~/graphql/mutations/file_explorer_mutations'
import type { 
  GetFileContentQuery, 
  GetFileContentQueryVariables, 
  ApplyFileChangeMutation, 
  ApplyFileChangeMutationVariables,
  SearchFilesQuery,
  SearchFilesQueryVariables,
} from '~/generated/graphql'
import { useWorkspaceStore } from '~/stores/workspace'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import type { FileSystemChangeEvent } from '~/types/fileSystemChangeTypes'
import { findFileByPath } from '~/utils/fileExplorer/fileUtils'

interface FileExplorerState {
  openFolders: Record<string, boolean>;
  openFiles: string[];
  activeFile: string | null;
  fileContents: Record<string, string | null>;
  contentLoading: Record<string, boolean>;
  contentError: Record<string, string | null>;
  applyChangeError: Record<string, Record<number, Record<string, string | null>>>;
  applyChangeLoading: Record<string, Record<number, Record<string, boolean>>>;
  appliedChanges: Record<string, Record<number, Record<string, boolean>>>;
  searchResults: any[];
  searchLoading: boolean;
  searchError: string | null;
  workspaceId: string;
  basicFileChangeError: Record<string, string | null>;
  basicFileChangeLoading: Record<string, boolean>;
}

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerState => ({
    openFolders: {},
    openFiles: [],
    activeFile: null,
    fileContents: {},
    contentLoading: {},
    contentError: {},
    applyChangeError: {},
    applyChangeLoading: {},
    appliedChanges: {},
    searchResults: [],
    searchLoading: false,
    searchError: null,
    workspaceId: '',
    basicFileChangeError: {},
    basicFileChangeLoading: {},
  }),

  actions: {
    toggleFolder(folderPath: string) {
      this.openFolders[folderPath] = !this.openFolders[folderPath]
    },

    async openFile(filePath: string) {
      if (!this.openFiles.includes(filePath)) {
        this.openFiles.push(filePath)
        await this.fetchFileContent(filePath)
      }
      this.activeFile = filePath
      const fileContentDisplayModeStore = useFileContentDisplayModeStore()
      fileContentDisplayModeStore.showFullscreen()
    },

    closeFile(filePath: string) {
      this.openFiles = this.openFiles.filter(file => file !== filePath)
      delete this.fileContents[filePath]
      delete this.contentLoading[filePath]
      delete this.contentError[filePath]
      delete this.appliedChanges[filePath]
      if (this.activeFile === filePath) {
        this.activeFile = this.openFiles[this.openFiles.length - 1] || null
        if (!this.activeFile) {
          const fileContentDisplayModeStore = useFileContentDisplayModeStore()
          fileContentDisplayModeStore.hide()
        }
      }
    },

    setActiveFile(filePath: string) {
      if (this.openFiles.includes(filePath)) {
        this.activeFile = filePath
      }
    },

    async fetchFileContent(filePath: string) {
      if (this.fileContents[filePath] !== undefined) return

      this.contentLoading[filePath] = true
      this.contentError[filePath] = null

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId
      this.workspaceId = workspaceId

      try {
        const { onResult, onError } = useQuery<GetFileContentQuery, GetFileContentQueryVariables>(
          GetFileContent,
          { workspaceId, filePath }
        )

        return new Promise((resolve, reject) => {
          onResult((result) => {
            if (result.data?.fileContent) {
              this.fileContents[filePath] = result.data.fileContent
              this.contentLoading[filePath] = false
              resolve(result.data.fileContent)
            }
          })

          onError((error) => {
            console.error('Failed to fetch file content', error)
            this.contentError[filePath] = error.message
            this.contentLoading[filePath] = false
            reject(error)
          })
        })
      } catch (error) {
        this.contentError[filePath] = error instanceof Error ? error.message : 'Failed to fetch file content'
        this.contentLoading[filePath] = false
        throw error
      }
    },

    async applyBasicFileChange(workspaceId: string, filePath: string, content: string) {
      this.basicFileChangeError[filePath] = null
      this.basicFileChangeLoading[filePath] = true

      const { mutate } = useMutation<ApplyFileChangeMutation, ApplyFileChangeMutationVariables>(ApplyFileChange)

      try {
        const result = await mutate({ workspaceId, filePath, content })
        
        if (result?.data?.applyFileChange) {
          this.fileContents[filePath] = content
          console.log('File change applied successfully')
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.applyFileChange)
          const workspaceStore = useWorkspaceStore()
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.basicFileChangeLoading[filePath] = false
        return result
      } catch (err) {
        console.error('Failed to apply file change:', err)
        this.basicFileChangeError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.basicFileChangeLoading[filePath] = false
        throw err
      }
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
          this.fileContents[filePath] = content
          console.log('File change applied successfully')
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.applyFileChange)
          const workspaceStore = useWorkspaceStore()
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
          
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

    async searchFiles(query: string) {
      this.searchLoading = true
      this.searchError = null
      this.searchResults = []

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId
      this.workspaceId = workspaceId

      if (!query) {
        this.searchResults = workspaceStore.currentWorkspaceTree?.children || []
        this.searchLoading = false
        return
      }

      try {
        const { onResult, onError } = useQuery<SearchFilesQuery, SearchFilesQueryVariables>(
          SearchFiles,
          { workspaceId, query }
        )

        return new Promise((resolve, reject) => {
          onResult((result) => {
            if (result.data?.searchFiles) {
              const matchedPaths = result.data.searchFiles
              this.searchResults = matchedPaths.map(path => {
                return findFileByPath(workspaceStore.currentWorkspaceTree?.children || [], path)
              }).filter(file => file !== null)
            }
            this.searchLoading = false
            resolve(this.searchResults)
          })

          onError((error) => {
            console.error('Error searching files:', error)
            this.searchError = error.message
            this.searchLoading = false
            reject(error)
          })
        })
      } catch (error) {
        this.searchError = error instanceof Error ? error.message : 'Failed to search files'
        this.searchLoading = false
        throw error
      }
    },

    resetState() {
      this.openFolders = {}
      this.openFiles = []
      this.activeFile = null
      this.fileContents = {}
      this.contentLoading = {}
      this.contentError = {}
      this.applyChangeError = {}
      this.applyChangeLoading = {}
      this.appliedChanges = {}
      this.searchResults = []
      this.searchLoading = false
      this.searchError = null
      this.workspaceId = ''
      this.basicFileChangeError = {}
      this.basicFileChangeLoading = {}
    }
  },

  getters: {
    isFolderOpen: (state) => (folderPath: string): boolean => !!state.openFolders[folderPath],
    allOpenFolders: (state): string[] => Object.keys(state.openFolders).filter(folder => state.openFolders[folder]),
    getOpenFiles: (state): string[] => state.openFiles,
    getActiveFile: (state): string | null => state.activeFile,
    getFileContent: (state) => (filePath: string): string | null => state.fileContents[filePath] || null,
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
    isBasicChangeLoadingGetter: (state) => (filePath: string): boolean => {
      return state.basicFileChangeLoading[filePath] || false
    },
    getBasicChangeErrorGetter: (state) => (filePath: string): string | null => {
      return state.basicFileChangeError[filePath] || null
    }
  }
})
