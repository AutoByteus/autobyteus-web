import { ref } from 'vue'

export function usePanelResize() {
  // Initialize with a larger default width of 300px
  const fileExplorerWidth = ref(300)
  const contentViewerWidth = ref(400)
  
  const initDragFileToContent = (e: MouseEvent) => {
    e.preventDefault()
    
    const startX = e.clientX
    const startWidth = fileExplorerWidth.value
    
    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX
      // Set minimum and maximum constraints
      fileExplorerWidth.value = Math.min(Math.max(newWidth, 200), 600)
    }
    
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }
    
    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }
  
  const initDragContentToWorkflow = (e: MouseEvent, showContent: boolean) => {
    if (!showContent) return
    
    e.preventDefault()
    
    const startX = e.clientX
    const startWidth = contentViewerWidth.value
    
    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX
      // Set minimum and maximum constraints
      contentViewerWidth.value = Math.min(Math.max(newWidth, 200), 600)
    }
    
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }
    
    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }
  
  return {
    fileExplorerWidth,
    contentViewerWidth,
    initDragFileToContent,
    initDragContentToWorkflow
  }
}