import { ref } from 'vue'

export function useRightPanel() {
  // State for right panel visibility and width
  const isRightPanelVisible = ref(true)
  const rightPanelWidth = ref(300)
  const minRightPanelWidth = 200
  // Removed the fixed maximum constraint to allow free expansion
  // If desired, a dynamic maximum can be computed based on container size

  /**
   * Toggles the visibility of the right panel.
   */
  const toggleRightPanel = () => {
    isRightPanelVisible.value = !isRightPanelVisible.value
  }

  /**
   * Initializes the drag event to resize the right panel.
   * This function allows the right panel to be resized freely to the left.
   *
   * @param {MouseEvent} event - The mousedown event triggering the drag.
   */
  const initDragRightPanel = (event: MouseEvent) => {
    event.preventDefault()

    const startX = event.clientX
    const startWidth = rightPanelWidth.value

    /**
     * Handles the mousemove event during dragging.
     *
     * @param {MouseEvent} e - The mousemove event.
     */
    const doDrag = (e: MouseEvent) => {
      try {
        // Calculate delta: dragging left (decreasing clientX) increases panel width
        const deltaX = startX - e.clientX
        const newWidth = Math.max(startWidth + deltaX, minRightPanelWidth)
        rightPanelWidth.value = newWidth
      } catch (error) {
        console.error('Error during right panel drag:', error)
      }
    }

    /**
     * Stops the dragging by removing event listeners.
     */
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // Attach event listeners for dragging and stopping the drag
    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  return {
    isRightPanelVisible,
    rightPanelWidth,
    toggleRightPanel,
    initDragRightPanel
  }
}
