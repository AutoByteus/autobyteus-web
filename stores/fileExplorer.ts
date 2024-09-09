import { defineStore } from 'pinia'

export const useFileExplorerStore = defineStore('fileExplorer', {
  state: () => ({
    openFiles: {} as Record<string, boolean>
  }),
  actions: {
    toggleFile(filePath: string) {
      this.openFiles[filePath] = !this.openFiles[filePath]
    }
  }
})