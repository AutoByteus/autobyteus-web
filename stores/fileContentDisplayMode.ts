import { defineStore } from 'pinia'
import { snapshotService } from '~/services/snapshotService'

export type DisplayMode = 'hidden' | 'fullscreen' | 'preview'

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

    startMinimize() {
      console.log('Starting minimize process')
      this.isMinimizing = true
    },

    async finishMinimize() {
      console.log('Finishing minimize process')
      // Ensure we're still minimizing (could have been cancelled)
      if (this.isMinimizing) {
        this.displayMode = 'preview'
        this.isMinimizing = false
        console.log('Display mode changed to preview')
      }
    },

    hide() {
      console.log('Hiding viewer')
      this.displayMode = 'hidden'
      this.isMinimizing = false
      snapshotService.clearSnapshot()
    },

    resetState() {
      console.log('Resetting display mode state')
      this.displayMode = 'hidden'
      this.isMinimizing = false
      snapshotService.clearSnapshot()
    }
  },

  getters: {
    isFullscreenMode: (state): boolean => state.displayMode === 'fullscreen',
    isPreviewMode: (state): boolean => state.displayMode === 'preview',
  }
})
