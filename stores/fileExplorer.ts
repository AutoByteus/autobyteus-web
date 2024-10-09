// File: /home/ryan-ai/miniHDD/Learning/chatgpt/autobyteus_org_workspace/autobyteus-web/stores/fileExplorer.ts
import { defineStore } from 'pinia'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GetFileContent } from '~/graphql/queries/file_explorer_queries'
import { ApplyFileChange } from '~/graphql/mutations/file_explorer_mutations'
import type { GetFileContentQuery, GetFileContentQueryVariables, ApplyFileChangeMutation, ApplyFileChangeMutationVariables } from '~/generated/graphql'

interface FileExplorerState {
  openFolders: Record<string, boolean>;
  openFiles: string[];
  activeFile: string | null;
  fileContents: Map<string, string>;
  contentLoading: Record<string, boolean>;
  contentError: Record<string, string | null>;
}

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerState => ({
    openFolders: {},
    openFiles: [],
    activeFile: null,
    fileContents: new Map(),
    contentLoading: {},
    contentError: {}
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
      const workspaceRootPath = workspaceStore.currentSelectedWorkspacePath

      const { onResult, onError } = useQuery<GetFileContentQuery, GetFileContentQueryVariables>(
        GetFileContent,
        { workspaceRootPath, filePath }
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
    async applyFileChange(workspaceRootPath: string, filePath: string, content: string) {
      const { mutate, onDone, onError } = useMutation<ApplyFileChangeMutation, ApplyFileChangeMutationVariables>(ApplyFileChange)

      try {
        await mutate({ workspaceRootPath, filePath, content })
        
        onDone((result) => {
          if (result.data?.applyFileChange) {
            // Update the local file content
            this.fileContents.set(filePath, content)
            console.log('File change applied successfully')
          }
        })

        onError((error) => {
          console.error('Error applying file change:', error)
          throw error
        })
      } catch (error) {
        console.error('Failed to apply file change:', error)
        throw error
      }
    }
  },
  getters: {
    isFolderOpen: (state) => (folderPath: string): boolean => !!state.openFolders[folderPath],
    allOpenFolders: (state): string[] => Object.keys(state.openFolders).filter(folder => state.openFolders[folder]),
    getOpenFiles: (state): string[] => state.openFiles,
    getActiveFile: (state): string | null => state.activeFile,
    getFileContent: (state) => (filePath: string): string | null => state.fileContents.get(filePath) || null,
    isContentLoading: (state) => (filePath: string): boolean => !!state.contentLoading[filePath],
    getContentError: (state) => (filePath: string): string | null => state.contentError[filePath] || null
  }
})