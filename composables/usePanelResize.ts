import { ref, onBeforeUnmount } from 'vue'

export function usePanelResize() {
  // Panel widths
  const fileExplorerWidth = ref(200)
  const contentViewerWidth = ref(300)

  // Dragging states
  const isDraggingFileToContent = ref(false)
  const isDraggingContentToWorkflow = ref(false)
  const startXFileToContent = ref(0)
  const startXContentToWorkflow = ref(0)
  const startFileExplorerWidth = ref(200)
  const startContentViewerWidth = ref(300)
  const startContentViewerWidthWorkflow = ref(300)

  // File to Content drag handlers
  const initDragFileToContent = (e: MouseEvent) => {
    isDraggingFileToContent.value = true
    startXFileToContent.value = e.clientX
    startFileExplorerWidth.value = fileExplorerWidth.value
    startContentViewerWidth.value = contentViewerWidth.value
    window.addEventListener('mousemove', onDragFileToContent)
    window.addEventListener('mouseup', stopDragFileToContent)
  }

  const onDragFileToContent = (e: MouseEvent) => {
    if (!isDraggingFileToContent.value) return
    const dx = e.clientX - startXFileToContent.value
    updateFileToContentWidths(dx)
  }

  const updateFileToContentWidths = (dx: number) => {
    const newFileExplorerWidth = startFileExplorerWidth.value + dx
    const newContentViewerWidth = startContentViewerWidth.value - dx
    
    const maxContentViewerWidth = window.innerWidth * 0.75
    const minFileExplorerWidth = 150
    const maxFileExplorerWidth = window.innerWidth - maxContentViewerWidth - 100
    const minContentViewerWidth = 100
    
    if (newFileExplorerWidth > minFileExplorerWidth && newFileExplorerWidth < maxFileExplorerWidth) {
      fileExplorerWidth.value = newFileExplorerWidth
    }
    if (newContentViewerWidth > minContentViewerWidth && newContentViewerWidth < maxContentViewerWidth) {
      contentViewerWidth.value = newContentViewerWidth
    }
  }

  const stopDragFileToContent = () => {
    isDraggingFileToContent.value = false
    window.removeEventListener('mousemove', onDragFileToContent)
    window.removeEventListener('mouseup', stopDragFileToContent)
  }

  // Content to Workflow drag handlers
  const initDragContentToWorkflow = (e: MouseEvent, showFileContent: boolean) => {
    if (!showFileContent) return
    isDraggingContentToWorkflow.value = true
    startXContentToWorkflow.value = e.clientX
    startContentViewerWidthWorkflow.value = contentViewerWidth.value
    window.addEventListener('mousemove', onDragContentToWorkflow)
    window.addEventListener('mouseup', stopDragContentToWorkflow)
  }

  const onDragContentToWorkflow = (e: MouseEvent) => {
    if (!isDraggingContentToWorkflow.value) return
    const dx = e.clientX - startXContentToWorkflow.value
    updateContentToWorkflowWidth(dx)
  }

  const updateContentToWorkflowWidth = (dx: number) => {
    const newContentViewerWidth = startContentViewerWidthWorkflow.value + dx
    const maxContentViewerWidth = window.innerWidth * 0.75
    const minContentViewerWidth = 100
    
    if (newContentViewerWidth > minContentViewerWidth && newContentViewerWidth < maxContentViewerWidth) {
      contentViewerWidth.value = newContentViewerWidth
    }
  }

  const stopDragContentToWorkflow = () => {
    isDraggingContentToWorkflow.value = false
    window.removeEventListener('mousemove', onDragContentToWorkflow)
    window.removeEventListener('mouseup', stopDragContentToWorkflow)
  }

  // Cleanup
  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onDragFileToContent)
    window.removeEventListener('mouseup', stopDragFileToContent)
    window.removeEventListener('mousemove', onDragContentToWorkflow)
    window.removeEventListener('mouseup', stopDragContentToWorkflow)
  })

  return {
    fileExplorerWidth,
    contentViewerWidth,
    initDragFileToContent,
    initDragContentToWorkflow
  }
}