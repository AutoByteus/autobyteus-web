import { defineStore, storeToRefs } from 'pinia'
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

interface WorkspaceFileExplorerState {
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
  basicFileChangeError: Record<string, string | null>;
  basicFileChangeLoading: Record<string, boolean>;
  deleteError: Record<string, string | null>;
  deleteLoading: Record<string, boolean>;
  moveError: Record<string, string | null>;
  moveLoading: Record<string, boolean>;
  renameError: Record<string, string | null>;
  renameLoading: Record<string, boolean>;
  createError: Record<string, string | null>;
  createLoading: Record<string, boolean>;
}

interface FileExplorerStoreState {
  fileExplorerStateByWorkspace: Map<string, WorkspaceFileExplorerState>;
}

const createDefaultWorkspaceFileExplorerState = (): WorkspaceFileExplorerState => ({
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
  basicFileChangeError: {},
  basicFileChangeLoading: {},
  deleteError: {},
  deleteLoading: {},
  moveError: {},
  moveLoading: {},
  renameError: {},
  renameLoading: {},
  createError: {},
  createLoading: {}
});

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerStoreState => ({
    fileExplorerStateByWorkspace: new Map(),
  }),

  getters: {
    _currentWorkspaceFileExplorerState(state): WorkspaceFileExplorerState | null {
      const workspaceStore = useWorkspaceStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!currentWorkspaceId) return null;
      return state.fileExplorerStateByWorkspace.get(currentWorkspaceId) || null;
    },

    isFolderOpen: (state) => (folderPath: string): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? !!wsState.openFolders[folderPath] : false;
    },
    getOpenFiles: (state): string[] => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.openFiles : [];
    },
    getActiveFile: (state): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.activeFile : null;
    },
    getFileContent: (state) => (filePath: string): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.fileContents[filePath] || null : null;
    },
    isContentLoading: (state) => (filePath: string): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? !!wsState.contentLoading[filePath] : false;
    },
    getContentError: (state) => (filePath: string): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.contentError[filePath] || null : null;
    },
    getSearchResults: (state): any[] => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.searchResults : [];
    },
    isSearchLoading: (state): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.searchLoading : false;
    },
    getSearchError: (state): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.searchError : null;
    },
  },

  actions: {
    _getOrCreateCurrentWorkspaceState(): WorkspaceFileExplorerState {
      const workspaceStore = useWorkspaceStore();
      const currentWorkspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!currentWorkspaceId) {
        throw new Error("Cannot get file explorer state: No workspace is selected.");
      }
      if (!this.fileExplorerStateByWorkspace.has(currentWorkspaceId)) {
        this.fileExplorerStateByWorkspace.set(currentWorkspaceId, createDefaultWorkspaceFileExplorerState());
      }
      return this.fileExplorerStateByWorkspace.get(currentWorkspaceId)!;
    },

    toggleFolder(folderPath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.openFolders[folderPath] = !wsState.openFolders[folderPath];
    },

    async openFile(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (!wsState.openFiles.includes(filePath)) {
        wsState.openFiles.push(filePath);
        await this.fetchFileContent(filePath);
      }
      wsState.activeFile = filePath;
      const fileContentDisplayModeStore = useFileContentDisplayModeStore();
      fileContentDisplayModeStore.showFullscreen();
    },

    closeFile(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.openFiles = wsState.openFiles.filter(file => file !== filePath);
      delete wsState.fileContents[filePath];
      delete wsState.contentLoading[filePath];
      delete wsState.contentError[filePath];
      if (wsState.activeFile === filePath) {
        wsState.activeFile = wsState.openFiles[wsState.openFiles.length - 1] || null;
        if (!wsState.activeFile) {
          const fileContentDisplayModeStore = useFileContentDisplayModeStore();
          fileContentDisplayModeStore.hide();
        }
      }
    },

    setActiveFile(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.openFiles.includes(filePath)) {
        wsState.activeFile = filePath;
      }
    },

    async fetchFileContent(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.fileContents[filePath] !== undefined) return;

      wsState.contentLoading[filePath] = true;
      wsState.contentError[filePath] = null;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("No workspace selected");

      try {
        const { onResult, onError } = useQuery<GetFileContentQuery, GetFileContentQueryVariables>(
          GetFileContent, { workspaceId, filePath }
        );

        return new Promise((resolve, reject) => {
          onResult((result) => {
            if (result.data) {
              wsState.fileContents[filePath] = result.data.fileContent;
              wsState.contentLoading[filePath] = false;
              resolve(result.data.fileContent);
            }
          });

          onError((error) => {
            console.error('Failed to fetch file content', error);
            wsState.contentError[filePath] = error.message;
            wsState.contentLoading[filePath] = false;
            reject(error);
          });
        });
      } catch (error) {
        wsState.contentError[filePath] = error instanceof Error ? error.message : 'Failed to fetch file content';
        wsState.contentLoading[filePath] = false;
        throw error;
      }
    },

    async writeBasicFileContent(workspaceId: string, filePath: string, content: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.basicFileChangeError[filePath] = null;
      wsState.basicFileChangeLoading[filePath] = true;

      const { mutate } = useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContent);

      try {
        const result = await mutate({ workspaceId, filePath, content });
        
        if (result?.data?.writeFileContent) {
          wsState.fileContents[filePath] = content;
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.writeFileContent);
          const workspaceStore = useWorkspaceStore();
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        }

        wsState.basicFileChangeLoading[filePath] = false;
        return result;
      } catch (err) {
        console.error('Failed to write basic file content:', err);
        wsState.basicFileChangeError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.basicFileChangeLoading[filePath] = false;
        throw err;
      }
    },

    async writeFileContent(
      workspaceId: string, filePath: string, content: string,
      conversationId: string, messageIndex: number
    ) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (!wsState.applyChangeError[conversationId]) wsState.applyChangeError[conversationId] = {};
      if (!wsState.applyChangeError[conversationId][messageIndex]) wsState.applyChangeError[conversationId][messageIndex] = {};
      if (!wsState.applyChangeLoading[conversationId]) wsState.applyChangeLoading[conversationId] = {};
      if (!wsState.applyChangeLoading[conversationId][messageIndex]) wsState.applyChangeLoading[conversationId][messageIndex] = {};

      wsState.applyChangeError[conversationId][messageIndex][filePath] = null;
      wsState.applyChangeLoading[conversationId][messageIndex][filePath] = true;

      const { mutate } = useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContent);

      try {
        const result = await mutate({ workspaceId, filePath, content });
        
        if (result?.data?.writeFileContent) {
          wsState.fileContents[filePath] = content;
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.writeFileContent);
          const workspaceStore = useWorkspaceStore();
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
          
          if (!wsState.appliedChanges[conversationId]) wsState.appliedChanges[conversationId] = {};
          if (!wsState.appliedChanges[conversationId][messageIndex]) wsState.appliedChanges[conversationId][messageIndex] = {};
          wsState.appliedChanges[conversationId][messageIndex][filePath] = true;
        }

        wsState.applyChangeLoading[conversationId][messageIndex][filePath] = false;
        return result;
      } catch (err) {
        console.error('Failed to write file content:', err);
        wsState.applyChangeError[conversationId][messageIndex][filePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.applyChangeLoading[conversationId][messageIndex][filePath] = false;
        throw err;
      }
    },
    
    async deleteFileOrFolder(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.deleteError[filePath] = null;
      wsState.deleteLoading[filePath] = true;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("No workspace selected");

      try {
        const { mutate } = useMutation<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>(DeleteFileOrFolder);
        const result = await mutate({ workspaceId, path: filePath });

        if (result?.data?.deleteFileOrFolder) {
          if (wsState.openFiles.includes(filePath)) this.closeFile(filePath);
          wsState.openFiles = wsState.openFiles.filter(file => !file.startsWith(filePath + '/'));
          
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.deleteFileOrFolder);
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        }
        wsState.deleteLoading[filePath] = false;
        return result;
      } catch (err) {
        console.error('Failed to delete file/folder:', err);
        wsState.deleteError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.deleteLoading[filePath] = false;
        throw err;
      }
    },
    
    async renameFileOrFolder(targetPath: string, newName: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.renameError[targetPath] = null;
      wsState.renameLoading[targetPath] = true;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("No workspace selected");

      const { mutate } = useMutation<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>(RenameFileOrFolder);

      try {
        const result = await mutate({ workspaceId, targetPath, newName });

        if (result?.data?.renameFileOrFolder) {
          const segments = targetPath.split('/');
          segments[segments.length - 1] = newName;
          const newPath = segments.join('/');

          const index = wsState.openFiles.indexOf(targetPath);
          if (index > -1) {
            wsState.openFiles[index] = newPath;
          }
          if (wsState.activeFile === targetPath) {
            wsState.activeFile = newPath;
          }
          if (wsState.fileContents[targetPath] !== undefined) {
            wsState.fileContents[newPath] = wsState.fileContents[targetPath];
            delete wsState.fileContents[targetPath];
          }

          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.renameFileOrFolder);
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        }

        wsState.renameLoading[targetPath] = false;
        return result;
      } catch (err) {
        console.error('Failed to rename file/folder:', err);
        wsState.renameError[targetPath] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.renameLoading[targetPath] = false;
        throw err;
      }
    },

    async moveFileOrFolder(sourcePath: string, destinationPath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.moveError[sourcePath] = null;
      wsState.moveLoading[sourcePath] = true;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("No workspace selected");
      
      const { mutate } = useMutation<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>(MoveFileOrFolder);

      try {
        const result = await mutate({ workspaceId, sourcePath, destinationPath });

        if (result?.data?.moveFileOrFolder) {
          if (wsState.openFiles.includes(sourcePath)) {
            const newPath = destinationPath;
            const index = wsState.openFiles.indexOf(sourcePath);
            wsState.openFiles[index] = newPath;
            if (wsState.activeFile === sourcePath) {
              wsState.activeFile = newPath;
            }
            if (wsState.fileContents[sourcePath] !== undefined) {
              wsState.fileContents[newPath] = wsState.fileContents[sourcePath];
              delete wsState.fileContents[sourcePath];
            }
          }

          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.moveFileOrFolder);
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        }
        wsState.moveLoading[sourcePath] = false;
        return result;

      } catch (err) {
        console.error('Failed to move file/folder:', err);
        wsState.moveError[sourcePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.moveLoading[sourcePath] = false;
        throw err;
      }
    },

    async createFileOrFolder(path: string, isFile: boolean) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.createError[path] = null;
      wsState.createLoading[path] = true;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) throw new Error("No workspace selected");

      const { mutate } = useMutation<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables>(CreateFileOrFolder);

      try {
        const result = await mutate({ workspaceId, path, isFile });

        if (result?.data?.createFileOrFolder) {
            const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.createFileOrFolder);
            workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        }
        wsState.createLoading[path] = false;
        return result;

      } catch(err) {
        console.error('Failed to create file/folder:', err);
        wsState.createError[path] = err instanceof Error ? err.message : 'An unknown error occurred';
        wsState.createLoading[path] = false;
        throw err;
      }
    },

    async searchFiles(query: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const workspaceStore = useWorkspaceStore();
      
      wsState.searchLoading = true;
      wsState.searchError = null;
      
      if (!query.trim()) {
        // When query is cleared, searchResults should be empty to show the file tree.
        wsState.searchResults = [];
        wsState.searchLoading = false;
        return;
      }
      
      const workspaceId = workspaceStore.currentSelectedWorkspaceId;
      if (!workspaceId) {
        wsState.searchError = "No workspace selected.";
        wsState.searchLoading = false;
        return;
      }
      
      try {
        const { onResult, onError } = useQuery<SearchFilesQuery, SearchFilesQueryVariables>(
          SearchFiles,
          { workspaceId, query }
        );

        return new Promise<void>((resolve, reject) => {
          onResult((result) => {
            if (result.data?.searchFiles) {
              const matchedPaths = result.data.searchFiles;
              // Use findFileByPath to look up nodes from the main tree
              wsState.searchResults = matchedPaths.map(path => {
                return findFileByPath(workspaceStore.currentWorkspaceTree?.children || [], path);
              }).filter((file): file is NonNullable<typeof file> => file !== null);
            }
            wsState.searchLoading = false;
            resolve();
          });

          onError((error) => {
            console.error('Error searching files:', error);
            wsState.searchError = error.message;
            wsState.searchLoading = false;
            reject(error);
          });
        });
      } catch (error) {
        wsState.searchError = error instanceof Error ? error.message : 'Failed to search files';
        wsState.searchLoading = false;
        throw error;
      }
    },
    
    isApplyChangeInProgress(conversationId: string, messageIndex: number, filePath: string): boolean {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      return !!(wsState.applyChangeLoading[conversationId]?.[messageIndex]?.[filePath]);
    },
    isChangeApplied(conversationId: string, messageIndex: number, filePath: string): boolean {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      return wsState.appliedChanges[conversationId]?.[messageIndex]?.[filePath] || false;
    },
    getApplyChangeError(conversationId: string, messageIndex: number, filePath: string): string | null {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      return wsState.applyChangeError[conversationId]?.[messageIndex]?.[filePath] || null;
    },
  }
});
