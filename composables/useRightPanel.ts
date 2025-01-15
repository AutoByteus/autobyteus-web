import { ref } from 'vue'

export function useRightPanel() {
  const isRightPanelVisible = ref(true)
  const rightPanelWidth = ref(300)
  const minRightPanelWidth = 200
  const maxRightPanelWidth = 800

  const toggleRightPanel = () => {
    isRightPanelVisible.value = !isRightPanelVisible.value
  }

  const initDragRightPanel = (event: MouseEvent) => {
    event.preventDefault()
    
    const startX = event.clientX
    const startWidth = rightPanelWidth.value
    
    const doDrag = (e: MouseEvent) => {
      const deltaX = startX - e.clientX
      const newWidth = Math.min(
        Math.max(startWidth + deltaX, minRightPanelWidth),
        maxRightPanelWidth
      )
      rightPanelWidth.value = newWidth
    }

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

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
