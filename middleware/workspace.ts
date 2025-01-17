import { useWorkspaceStore } from '~/stores/workspace'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only protect /workspace route
  if (to.path === '/workspace') {
    const workspaceStore = useWorkspaceStore()
    
    // If no workspace is selected, redirect to home
    if (!workspaceStore.currentSelectedWorkspaceId) {
      return navigateTo('/')
    }
  }
})
