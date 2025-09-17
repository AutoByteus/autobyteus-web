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
import { findFileByPath, determineFileType } from '~/utils/fileExplorer/fileUtils'
import { getServerUrls } from '~/utils/serverConfig'

// --- NEW TYPES FOR MULTI-CONTENT SUPPORT ---
export type FileDataType = 'Text' | 'Image' | 'Audio' | 'Video' | 'Unsupported';

export interface OpenFileState {
  path: string;
  type: FileDataType;
  content: string | null; // For text files
  url: string | null;     // For media files
  isLoading: boolean;
  error: string | null;
}
// ------------------------------------------

interface WorkspaceFileExplorerState {
  openFolders: Record<string, boolean>;
  openFiles: OpenFileState[];
  activeFile: string | null;
  
  // State for AI message "Apply" buttons
  applyChangeError: Record<string, Record<number, Record<string, string | null>>>;
  applyChangeLoading: Record<string, Record<number, Record<string, boolean>>>;
  appliedChanges: Record<string, Record<number, Record<string, boolean>>>;
  
  // State for file search
  searchResults: any[];
  searchLoading: boolean;
  searchError: string | null;
  
  // State for manual saves from the editor
  saveContentError: Record<string, string | null>;
  saveContentLoading: Record<string, boolean>;

  // State for other file operations
  deleteError: Record<string, string | null>;
  deleteLoading: Record<string, boolean>;
  moveError: Record<string, string | null>;
  moveLoading: Record<string, boolean>;
  renameError: Record<string, string | null>;
  renameLoading: Record<string, boolean>;
  createError: Record<string, string | null>;
  createLoading: Record<string, boolean>;

  // Used to prevent re-fetching content for self-initiated saves
  filesToIgnoreNextModify: Set<string>;
}

interface FileExplorerStoreState {
  fileExplorerStateByWorkspace: Map<string, WorkspaceFileExplorerState>;
}

const createDefaultWorkspaceFileExplorerState = (): WorkspaceFileExplorerState => ({
  openFolders: {},
  openFiles: [],
  activeFile: null,
  applyChangeError: {},
  applyChangeLoading: {},
  appliedChanges: {},
  searchResults: [],
  searchLoading: false,
  searchError: null,
  saveContentError: {},
  saveContentLoading: {},
  deleteError: {},
  deleteLoading: {},
  moveError: {},
  moveLoading: {},
  renameError: {},
  renameLoading: {},
  createError: {},
  createLoading: {},
  filesToIgnoreNextModify: new Set(),
});

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerStoreState => ({
    fileExplorerStateByWorkspace: new Map(),
  }),

  getters: {
    _currentWorkspaceFileExplorerState(state): WorkspaceFileExplorerState | null {
      const workspaceStore = useWorkspaceStore();
      const activeWorkspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!activeWorkspaceId) return null;
      return state.fileExplorerStateByWorkspace.get(activeWorkspaceId) || null;
    },

    isFolderOpen: (state) => (folderPath: string): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? !!wsState.openFolders[folderPath] : false;
    },
    getOpenFiles: (state): string[] => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.openFiles.map(f => f.path) : [];
    },
    getActiveFile: (state): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState ? wsState.activeFile : null;
    },
    getActiveFileData(state): OpenFileState | null {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      if (!wsState || !wsState.activeFile) return null;
      return wsState.openFiles.find(f => f.path === wsState.activeFile) || null;
    },
    getFileContent: (state) => (filePath: string): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      if (!wsState) return null;
      const file = wsState.openFiles.find(f => f.path === filePath);
      return file ? file.content : null;
    },
    isContentLoading: (state) => (filePath: string): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      if (!wsState) return false;
      const file = wsState.openFiles.find(f => f.path === filePath);
      return file ? file.isLoading : false;
    },
    getContentError: (state) => (filePath: string): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      if (!wsState) return null;
      const file = wsState.openFiles.find(f => f.path === filePath);
      return file ? file.error : null;
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
    isSaveContentLoading: (state) => (filePath: string): boolean => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState?.saveContentLoading[filePath] || false;
    },
    getSaveContentError: (state) => (filePath: string): string | null => {
      const wsState = (state as any)._currentWorkspaceFileExplorerState;
      return wsState?.saveContentError[filePath] || null;
    },
  },

  actions: {
    _getOrCreateCurrentWorkspaceState(): WorkspaceFileExplorerState {
      const workspaceStore = useWorkspaceStore();
      const activeWorkspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!activeWorkspaceId) {
        throw new Error("Cannot get file explorer state: No active workspace session.");
      }
      if (!this.fileExplorerStateByWorkspace.has(activeWorkspaceId)) {
        this.fileExplorerStateByWorkspace.set(activeWorkspaceId, createDefaultWorkspaceFileExplorerState());
      }
      return this.fileExplorerStateByWorkspace.get(activeWorkspaceId)!;
    },

    toggleFolder(folderPath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.openFolders[folderPath] = !wsState.openFolders[folderPath];
    },

    async openFile(pathOrUrl: string) {
      console.log(`[FileExplorer] Opening file: ${pathOrUrl}`);
      const wsState = this._getOrCreateCurrentWorkspaceState();
      
      const existingFile = wsState.openFiles.find(f => f.path === pathOrUrl);

      if (!existingFile) {
        const workspaceStore = useWorkspaceStore();
        const isExternalUrl = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');
        const fileType = await determineFileType(pathOrUrl);
        console.log(`[FileExplorer] Determined file type for "${pathOrUrl}": ${fileType}`);

        const newFileState: OpenFileState = {
          path: pathOrUrl,
          type: fileType,
          content: null,
          url: null,
          isLoading: true,
          error: null,
        };
        wsState.openFiles.push(newFileState);
        console.log('[FileExplorer] Pushed new initial file state:', JSON.parse(JSON.stringify(newFileState)));

        if (isExternalUrl) {
          console.log(`[FileExplorer] Handling as an external URL.`);
          newFileState.url = pathOrUrl;
          newFileState.isLoading = false;
        } else {
          console.log(`[FileExplorer] Handling as a workspace path.`);
          if (newFileState.type === 'Text') {
            console.log(`[FileExplorer] Fetching text content for "${pathOrUrl}" via GraphQL.`);
            this.fetchFileContent(pathOrUrl);
          } else if (['Image', 'Audio', 'Video'].includes(newFileState.type)) {
            const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
            if (workspaceId) {
              const serverUrls = getServerUrls();
              const restBaseUrl = serverUrls.rest.replace(/\/$/, ''); // Ensure no trailing slash
              const encodedFilePath = encodeURIComponent(pathOrUrl);
              newFileState.url = `${restBaseUrl}/workspaces/${workspaceId}/content?path=${encodedFilePath}`;
              newFileState.isLoading = false;
              console.log(`[FileExplorer] Constructed absolute media URL for "${pathOrUrl}": ${newFileState.url}`);
            } else {
              newFileState.error = "No active workspace to construct file URL.";
              newFileState.isLoading = false;
              console.error(`[FileExplorer] Cannot construct media URL: No active workspace.`);
            }
          } else {
            console.warn(`[FileExplorer] Unsupported file type "${newFileState.type}" for "${pathOrUrl}".`);
            newFileState.isLoading = false;
          }
        }
      }
      
      wsState.activeFile = pathOrUrl;
      const fileContentDisplayModeStore = useFileContentDisplayModeStore();
      fileContentDisplayModeStore.showFullscreen();
    },

    closeFile(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.openFiles = wsState.openFiles.filter(file => file.path !== filePath);

      if (wsState.activeFile === filePath) {
        const lastOpenFile = wsState.openFiles[wsState.openFiles.length - 1];
        wsState.activeFile = lastOpenFile ? lastOpenFile.path : null;
        
        if (!wsState.activeFile) {
          const fileContentDisplayModeStore = useFileContentDisplayModeStore();
          fileContentDisplayModeStore.hide();
        }
      }
    },

    setActiveFile(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      if (wsState.openFiles.some(f => f.path === filePath)) {
        wsState.activeFile = filePath;
      }
    },

    async fetchFileContent(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const file = wsState.openFiles.find(f => f.path === filePath);
      if (!file || file.content !== null) return;

      file.isLoading = true;
      file.error = null;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) throw new Error("No active workspace session");

      try {
        const { onResult, onError } = useQuery<GetFileContentQuery, GetFileContentQueryVariables>(
          GetFileContent,
          { workspaceId, filePath },
          { fetchPolicy: 'network-only' }
        );

        return new Promise((resolve, reject) => {
          onResult((result) => {
            if (result.data) {
              const content = result.data.fileContent ?? '';
              if (file) {
                file.content = content;
                file.isLoading = false;
              }
              resolve(content);
            }
          });

          onError((error) => {
            console.error('Failed to fetch file content', error);
            if (file) {
              file.error = error.message;
              file.isLoading = false;
            }
            reject(error);
          });
        });
      } catch (error) {
        if (file) {
          file.error = error instanceof Error ? error.message : 'Failed to fetch file content';
          file.isLoading = false;
        }
        throw error;
      }
    },
    
    invalidateFileContent(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      const file = wsState.openFiles.find(f => f.path === filePath);

      if (file && file.type === 'Text') {
        file.content = null;
        this.fetchFileContent(filePath);
      }
    },

    /**
     * Core private action for writing file content. Handles the GraphQL mutation and
     * updates the primary state. It is called by public wrapper actions.
     * @private
     */
    async _writeFileCore(workspaceId: string, filePath: string, content: string) {
      const { mutate } = useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContent);
      const wsState = this._getOrCreateCurrentWorkspaceState();
      
      // "Tag" this file to ignore the incoming subscription event echo for 'modify'
      wsState.filesToIgnoreNextModify.add(filePath);
      // Safety timeout to clear the tag in case the subscription message fails
      setTimeout(() => {
        wsState.filesToIgnoreNextModify.delete(filePath);
      }, 5000);

      try {
        const result = await mutate({ workspaceId, filePath, content });
      
        if (result?.data?.writeFileContent) {
          // Optimistic update: the mutation was successful, so update our local state immediately.
          const file = wsState.openFiles.find(f => f.path === filePath);
          if (file) {
            file.content = content;
          }
          // Let the subscription handle the tree change event to avoid double-processing.
          // The subscription will call handleFileSystemChange, which will now intelligently
          // ignore the 'modify' event for this file path.
          const changeEvent: FileSystemChangeEvent = JSON.parse(result.data.writeFileContent);
          const workspaceStore = useWorkspaceStore();
          workspaceStore.handleFileSystemChange(workspaceId, changeEvent);
        } else if (result?.errors) {
          wsState.filesToIgnoreNextModify.delete(filePath); // Clean up tag on error
          throw new Error(result.errors.map(e => e.message).join(', '));
        } else {
          wsState.filesToIgnoreNextModify.delete(filePath); // Clean up tag on error
          throw new Error('An unknown error occurred while writing the file.');
        }
      } catch (err) {
        console.error('Core file write operation failed:', err);
        wsState.filesToIgnoreNextModify.delete(filePath); // Clean up tag on error
        // Re-throw the error to be caught by the calling wrapper action
        throw err;
      }
    },

    /**
     * Saves file content, typically initiated by a user from the file editor.
     * Manages UI state for save indicators in the editor.
     */
    async saveFileContentFromEditor(workspaceId: string, filePath: string, content: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.saveContentError[filePath] = null;
      wsState.saveContentLoading[filePath] = true;

      try {
        await this._writeFileCore(workspaceId, filePath, content);
      } catch (err) {
        wsState.saveContentError[filePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        // Let the component handle the error propagation if needed
        throw err;
      } finally {
        wsState.saveContentLoading[filePath] = false;
      }
    },

    /**
     * Applies a file change that was proposed in an AI message.
     * Manages the complex UI state related to a specific message segment.
     */
    async applyFileChangeFromAIMessage(
      workspaceId: string, filePath: string, content: string,
      conversationId: string, messageIndex: number
    ) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      // Initialize nested state objects if they don't exist
      if (!wsState.applyChangeError[conversationId]) wsState.applyChangeError[conversationId] = {};
      if (!wsState.applyChangeError[conversationId][messageIndex]) wsState.applyChangeError[conversationId][messageIndex] = {};
      if (!wsState.applyChangeLoading[conversationId]) wsState.applyChangeLoading[conversationId] = {};
      if (!wsState.applyChangeLoading[conversationId][messageIndex]) wsState.applyChangeLoading[conversationId][messageIndex] = {};

      wsState.applyChangeError[conversationId][messageIndex][filePath] = null;
      wsState.applyChangeLoading[conversationId][messageIndex][filePath] = true;

      try {
        await this._writeFileCore(workspaceId, filePath, content);
        
        // On success, update the 'applied' status for this specific message segment
        if (!wsState.appliedChanges[conversationId]) wsState.appliedChanges[conversationId] = {};
        if (!wsState.appliedChanges[conversationId][messageIndex]) wsState.appliedChanges[conversationId][messageIndex] = {};
        wsState.appliedChanges[conversationId][messageIndex][filePath] = true;
      } catch (err) {
        wsState.applyChangeError[conversationId][messageIndex][filePath] = err instanceof Error ? err.message : 'An unknown error occurred';
        throw err;
      } finally {
        wsState.applyChangeLoading[conversationId][messageIndex][filePath] = false;
      }
    },
    
    async deleteFileOrFolder(filePath: string) {
      const wsState = this._getOrCreateCurrentWorkspaceState();
      wsState.deleteError[filePath] = null;
      wsState.deleteLoading[filePath] = true;

      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) throw new Error("No active workspace session");

      try {
        const { mutate } = useMutation<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>(DeleteFileOrFolder);
        const result = await mutate({ workspaceId, path: filePath });

        if (result?.data?.deleteFileOrFolder) {
          if (wsState.openFiles.some(f => f.path === filePath)) this.closeFile(filePath);
          wsState.openFiles = wsState.openFiles.filter(file => !file.path.startsWith(filePath + '/'));
          
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
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) throw new Error("No active workspace session");
    
      const { mutate } = useMutation<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>(RenameFileOrFolder);
    
      try {
        const result = await mutate({ workspaceId, targetPath, newName });
    
        if (result?.data?.renameFileOrFolder) {
          const segments = targetPath.split('/');
          segments[segments.length - 1] = newName;
          const newPath = segments.join('/');
    
          const file = wsState.openFiles.find(f => f.path === targetPath);
          if (file) {
            file.path = newPath;
          }
          if (wsState.activeFile === targetPath) {
            wsState.activeFile = newPath;
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
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) throw new Error("No active workspace session");
      
      const { mutate } = useMutation<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>(MoveFileOrFolder);
    
      try {
        const result = await mutate({ workspaceId, sourcePath, destinationPath });
    
        if (result?.data?.moveFileOrFolder) {
          const file = wsState.openFiles.find(f => f.path === sourcePath);
          if (file) {
            file.path = destinationPath;
          }
          if (wsState.activeFile === sourcePath) {
            wsState.activeFile = destinationPath;
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
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) throw new Error("No active workspace session");

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
        wsState.searchResults = [];
        wsState.searchLoading = false;
        return;
      }
      
      const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
      if (!workspaceId) {
        wsState.searchError = "No active workspace session.";
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
        wsState.searchError = error instanceof Error ? error.message : 'An unknown error occurred';
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
