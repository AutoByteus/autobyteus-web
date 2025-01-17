<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to AutoByteUs</h1>
        <p class="text-lg text-gray-600">Select an existing workspace or create a new one to get started</p>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- Get Started Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <button
            @click="showAddWorkspaceModal = true"
            class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Workspace
          </button>
        </div>

        <!-- Workspaces Grid -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">Your Workspaces</h2>
          
          <div v-if="isLoading" class="text-center py-8">
            <p class="text-gray-500">Loading workspaces...</p>
          </div>
          
          <div v-else-if="workspaces.length === 0" class="text-center py-8">
            <p class="text-gray-500">No workspaces found. Create one to get started.</p>
          </div>
          
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              @click="selectWorkspace(workspace.id)"
              class="group cursor-pointer p-4 border rounded-lg hover:border-blue-500 transition-all"
            >
              <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50">
                  <svg class="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 group-hover:text-blue-600">{{ workspace.name }}</h3>
                  <p class="text-sm text-gray-500">{{ workspace.path }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Workspace Modal -->
      <Modal v-if="showAddWorkspaceModal" @close="showAddWorkspaceModal = false">
        <AddWorkspaceForm
          @close="showAddWorkspaceModal = false"
          @workspace-added="handleWorkspaceAdded"
        />
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import Modal from '~/components/common/Modal.vue'
import AddWorkspaceForm from '~/components/workspace/AddWorkspaceForm.vue'

const workspaceStore = useWorkspaceStore()
const showAddWorkspaceModal = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  await workspaceStore.fetchAllWorkspaces()
  isLoading.value = false
})

const workspaces = computed(() => {
  return Object.entries(workspaceStore.workspaces).map(([id, workspace]) => ({
    id,
    name: workspace.name,
    path: workspace.path
  }))
})

const selectWorkspace = async (workspaceId: string) => {
  await workspaceStore.setSelectedWorkspaceId(workspaceId)
  await navigateTo('/workspace')
}

const handleWorkspaceAdded = async () => {
  showAddWorkspaceModal.value = false
  // Navigate to workspace view after successful creation
  if (workspaceStore.currentSelectedWorkspaceId) {
    await navigateTo('/workspace')
  }
}
</script>
