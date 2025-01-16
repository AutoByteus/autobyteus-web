import { ref } from 'vue'
import html2canvas from 'html2canvas'

export const snapshotService = {
  currentSnapshot: ref<string>(''),

  async captureSnapshot(element: HTMLElement) {
    console.log('Attempting to capture snapshot');

    try {
      if (!element || !element.isConnected) {
        throw new Error('Invalid or disconnected element');
      }

      console.log('Element:', element);
      console.log('Element dimensions:', {
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
      });
      console.log('Element visibility:', {
        display: window.getComputedStyle(element).display,
        visibility: window.getComputedStyle(element).visibility,
        opacity: window.getComputedStyle(element).opacity,
      });
      const canvas = await html2canvas(element, {
        backgroundColor: 'white',
        scale: 1, // Adjusted for performance
        useCORS: true,
        logging: false, // Disable logging for improved performance
        allowTaint: false, // Ensure cross-origin restrictions are respected
      });

      this.currentSnapshot.value = canvas.toDataURL('image/png');
      console.log('Snapshot captured successfully');
      return this.currentSnapshot.value;
    } catch (error) {
      console.error('Snapshot capture error:', error);
      throw error;
    }
  },

  getSnapshot() {
    return this.currentSnapshot.value;
  },

  clearSnapshot() {
    this.currentSnapshot.value = '';
  },
}