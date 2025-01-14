import { ref } from 'vue'
import html2canvas from 'html2canvas'

export const snapshotService = {
  currentSnapshot: ref<string>(''),

  async captureSnapshot(element: HTMLElement) {
    console.log('Attempting to capture snapshot')
    console.log('Element:', element)
    console.log('Element dimensions:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight
    })
    console.log('Element visibility:', {
      display: window.getComputedStyle(element).display,
      visibility: window.getComputedStyle(element).visibility,
      opacity: window.getComputedStyle(element).opacity
    })

    try {
      if (!element || !element.isConnected) {
        throw new Error('Invalid or disconnected element')
      }

      // Wait a brief moment to ensure element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        backgroundColor: 'white',
        scale: 2,
        logging: true, // Enable logging for debugging
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          console.log('Cloned document:', clonedDoc)
          const clonedElement = clonedDoc.getElementById('contentViewer')
          console.log('Cloned element:', clonedElement)
          if (clonedElement) {
            console.log('Cloned element dimensions:', {
              offsetWidth: clonedElement.offsetWidth,
              offsetHeight: clonedElement.offsetHeight
            })
          }
        }
      })
      
      this.currentSnapshot.value = canvas.toDataURL('image/png')
      console.log('Snapshot captured successfully')
      return this.currentSnapshot.value
    } catch (error) {
      console.error('Snapshot capture error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  getSnapshot() {
    return this.currentSnapshot.value
  },

  clearSnapshot() {
    this.currentSnapshot.value = ''
  }
}
