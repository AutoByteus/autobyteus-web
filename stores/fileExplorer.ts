import { defineStore } from 'pinia'

interface FileExplorerState {
  openFiles: Record<string, boolean>;
}

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: (): FileExplorerState => ({
    openFiles: {}
  }),
  actions: {
    toggleFile(filePath: string) {
      this.openFiles[filePath] = !this.openFiles[filePath]
    }
  },
  getters: {
    isFileOpen: (state) => (filePath: string): boolean => !!state.openFiles[filePath],
    allOpenFiles: (state): string[] => Object.keys(state.openFiles).filter(file => state.openFiles[file])
  }
})