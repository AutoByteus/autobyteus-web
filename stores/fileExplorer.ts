import { defineStore } from 'pinia'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GetFileContent, SearchFiles } from '~/graphql/queries/file_explorer_queries'
import { 
  WriteFileContent, 
  DeleteFileOrFolder, 
  MoveFileOrFolder,
  RenameFileOrFolder,
  CreateFileOrFolder
} from '~/graphql/mutations/file_explorer_mutations'
import type { 
  GetFileContentQuery, 
  GetFileContentQueryVariables, 
  WriteFileContentMutation, 
  WriteFileContentMutationVariables,
  DeleteFileOrFolderMutation,
  DeleteFileOrFolderMutationVariables,
  MoveFileOrFolderMutation,
  MoveFileOrFolderMutationVariables,
  SearchFilesQuery,
  SearchFilesQueryVariables,
  RenameFileOrFolderMutation,
  RenameFileOrFolderMutationVariables,
  CreateFileOrFolderMutation,
  CreateFileOrFolderMutationVariables
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

  deleteError: Record<string, string | null>;
  deleteLoading: Record<string, boolean>;

  moveError: Record<string, string | null>;
  moveLoading: Record<string, boolean>;

  renameError: Record<string, string | null>;
  renameLoading: Record<string, boolean>;

  /* For creating new file/folder */
  createError: Record<string, string | null>;
  createLoading: Record<string, boolean>;
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

    deleteError: {},
    deleteLoading: {},

    moveError: {},
    moveLoading: {},

    renameError: {},
    renameLoading: {},

    /* For creating new file/folder */
    createError: {},
    createLoading: {}
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
      // Already loaded once? skip re-query if we have content
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

    async writeBasicFileContent(workspaceId: string, filePath: string, content: string) {
      this.basicFileChangeError[filePath] = null
      this.basicFileChangeLoading[filePath] = true

      const { mutate } = useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContent)

      try {
        const result = await mutate({ workspaceId, filePath, content })
        
        if (result?.data?.writeFileContent) {
          this.fileContents[filePath] = content
          console.log('File content written successfully (basic).')
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.writeFileContent)
          const workspaceStore = useWorkspaceStore()
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.basicFileChangeLoading[filePath] = false
        return result
      } catch (err) {
        console.error('Failed to write file content (basic):', err)
        this.basicFileChangeError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.basicFileChangeLoading[filePath] = false
        throw err
      }
    },

    async writeFileContent(
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

      const { mutate } = useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContent)

      try {
        const result = await mutate({ workspaceId, filePath, content })
        
        if (result?.data?.writeFileContent) {
          this.fileContents[filePath] = content
          console.log('File content written successfully.')
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.writeFileContent)
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
        console.error('Failed to write file content:', err)
        this.applyChangeError[conversationId][messageIndex][filePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.applyChangeLoading[conversationId][messageIndex][filePath] = false
        throw err
      }
    },

    async deleteFileOrFolder(filePath: string) {
      this.deleteError[filePath] = null
      this.deleteLoading[filePath] = true

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId

      try {
        const { mutate } = useMutation<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>(DeleteFileOrFolder)
        const result = await mutate({ workspaceId, path: filePath })

        if (result?.data?.deleteFileOrFolder) {
          // If this file was open, close it
          if (this.openFiles.includes(filePath)) {
            this.closeFile(filePath)
          }
          // Also close any subfiles if user deletes a folder
          this.openFiles = this.openFiles.filter(file => !file.startsWith(filePath + '/'))
          
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.deleteFileOrFolder)
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.deleteLoading[filePath] = false
        return result
      } catch (err) {
        console.error('Failed to delete file/folder:', err)
        this.deleteError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.deleteLoading[filePath] = false
        throw err
      }
    },

    async moveFileOrFolder(sourcePath: string, destinationPath: string) {
      this.moveError[sourcePath] = null
      this.moveLoading[sourcePath] = true

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId

      try {
        const { mutate } = useMutation<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>(MoveFileOrFolder)
        const result = await mutate({ workspaceId, sourcePath, destinationPath })

        if (result?.data?.moveFileOrFolder) {
          // If this file/folder was open, adjust the openFiles array
          if (this.openFiles.includes(sourcePath)) {
            const newPath = destinationPath
            const index = this.openFiles.indexOf(sourcePath)
            this.openFiles[index] = newPath
            if (this.activeFile === sourcePath) {
              this.activeFile = newPath
            }
            if (this.fileContents[sourcePath] !== undefined) {
              this.fileContents[newPath] = this.fileContents[sourcePath]
              delete this.fileContents[sourcePath]
            }
          }

          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.moveFileOrFolder)
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.moveLoading[sourcePath] = false
        return result
      } catch (err) {
        console.error('Failed to move file/folder:', err)
        this.moveError[sourcePath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.moveLoading[sourcePath] = false
        throw err
      }
    },

    async renameFileOrFolder(targetPath: string, newName: string) {
      this.renameError[targetPath] = null
      this.renameLoading[targetPath] = true

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId

      const { mutate } = useMutation<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>(RenameFileOrFolder)

      try {
        const result = await mutate({ workspaceId, targetPath, newName })

        if (result?.data?.renameFileOrFolder) {
          // If this file is open, rename it in openFiles
          if (this.openFiles.includes(targetPath)) {
            // The new path will likely be parent path + newName
            const segments = targetPath.split('/')
            segments[segments.length - 1] = newName
            const newPath = segments.join('/')

            const index = this.openFiles.indexOf(targetPath)
            this.openFiles[index] = newPath
            if (this.activeFile === targetPath) {
              this.activeFile = newPath
            }
            // Also keep content reference if it's loaded
            if (this.fileContents[targetPath] !== undefined) {
              this.fileContents[newPath] = this.fileContents[targetPath]
              delete this.fileContents[targetPath]
            }
          }

          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.renameFileOrFolder)
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.renameLoading[targetPath] = false
        return result
      } catch (err) {
        console.error('Failed to rename file/folder:', err)
        this.renameError[targetPath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.renameLoading[targetPath] = false
        throw err
      }
    },

    /**
     * Create a file or folder in the workspace at a fully constructed path.
     * 'finalPath' is the entire path from the workspace root (e.g. "src/components/NewItem.ts").
     */
    async createFileOrFolder(finalPath: string, isFile: boolean) {
      this.createError[finalPath] = null
      this.createLoading[finalPath] = true

      const workspaceStore = useWorkspaceStore()
      const workspaceId = workspaceStore.currentSelectedWorkspaceId

      try {
        const { mutate } = useMutation<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables>(CreateFileOrFolder)
        const result = await mutate({ workspaceId, path: finalPath, isFile })

        if (result?.data?.createFileOrFolder) {
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.createFileOrFolder)
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent)
        }

        this.createLoading[finalPath] = false
        return result
      } catch (err) {
        console.error('Failed to create file/folder:', err)
        this.createError[finalPath] = err instanceof Error ? err.message : 'An unknown error occurred'
        this.createLoading[finalPath] = false
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

      this.deleteError = {}
      this.deleteLoading = {}

      this.moveError = {}
      this.moveLoading = {}

      this.renameError = {}
      this.renameLoading = {}

      this.createError = {}
      this.createLoading = {}
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
    },

    isDeleteLoading: (state) => (filePath: string): boolean => !!state.deleteLoading[filePath],
    getDeleteError: (state) => (filePath: string): string | null => state.deleteError[filePath] || null,

    isMoveLoading: (state) => (filePath: string): boolean => !!state.moveLoading[filePath],
    getMoveError: (state) => (filePath: string): string | null => state.moveError[filePath] || null,

    isRenameLoading: (state) => (path: string): boolean => !!state.renameLoading[path],
    getRenameError: (state) => (path: string): string | null => state.renameError[path] || null,

    /* For new file/folder creation */
    isCreateLoading: (state) => (path: string): boolean => !!state.createLoading[path],
    getCreateError: (state) => (path: string): string | null => state.createError[path] || null
  }
})
