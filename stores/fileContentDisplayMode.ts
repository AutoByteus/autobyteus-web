import { defineStore } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'

export type DisplayMode = 'hidden' | 'fullscreen' | 'minimized'

interface FileContentDisplayModeState {
  displayMode: DisplayMode;
  isMinimizing: boolean;
}

export const useFileContentDisplayModeStore = defineStore('fileContentDisplayMode', {
  state: (): FileContentDisplayModeState => ({
    displayMode: 'hidden',
    isMinimizing: false
  }),

  actions: {
    showFullscreen() {
      console.log('Showing fullscreen view')
      this.displayMode = 'fullscreen'
      this.isMinimizing = false
    },

    minimize() {
      console.log('Minimizing file viewer')
      // No need for multi-step process, just set to minimized directly
      this.displayMode = 'minimized'
      this.isMinimizing = false
    },

    restore() {
      console.log('Restoring file viewer to fullscreen')
      this.displayMode = 'fullscreen'
      this.isMinimizing = false
    },

    hide() {
      console.log('Hiding viewer')
      this.displayMode = 'hidden'
      this.isMinimizing = false
    },

    resetState() {
      console.log('Resetting display mode state')
      this.displayMode = 'hidden'
      this.isMinimizing = false
    }
  },

  getters: {
    isFullscreenMode: (state): boolean => state.displayMode === 'fullscreen',
    isMinimizedMode: (state): boolean => state.displayMode === 'minimized',
  }
})
