<template>
  <div class="workspace-section">
    <div class="current-workspace-card p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900">Current Workspace</h3>
        <button 
          @click="toggleExpanded"
          class="p-2 hover:bg-gray-50 rounded-lg"
        >
          <svg 
            class="w-5 h-5 text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div class="workspace-info flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <div class="workspace-icon p-2 bg-white rounded-lg">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-gray-900">
            {{ currentWorkspaceName || 'Select a workspace' }}
          </h4>
          <p v-if="!currentWorkspaceName" class="text-sm text-gray-500">
            No workspace selected
          </p>
          <p v-else class="text-sm text-gray-500">
            {{ currentWorkspacePath }}
          </p>
        </div>
      </div>
    </div>

    <!-- Workspace List -->
    <div v-if="isExpanded" class="mt-2 pl-4 space-y-1">
      <div 
        v-for="workspace in workspaces"
        :key="workspace.id"
        class="workspace-item group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
        :class="{
          'bg-blue-50 border-blue-200': workspace.id === selectedWorkspaceId,
          'hover:border-gray-300': workspace.id !== selectedWorkspaceId
        }"
        @click="selectWorkspace(workspace.id)"
      >
        <div class="flex-shrink-0">
          <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-gray-700 group-hover:text-gray-900 truncate">{{ workspace.name }}</div>
          <div class="text-xs text-gray-500 truncate">{{ workspace.path }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const emit = defineEmits(['workspace-selected'])
const workspaceStore = useWorkspaceStore()
const isExpanded = ref(false)

onMounted(async () => {
  await workspaceStore.fetchAllWorkspaces()
})

const workspaces = computed(() => {
  return Object.entries(workspaceStore.workspaces).map(([id, workspace]) => ({
    id,
    name: workspace.name,
    path: workspace.path
  }))
})

const selectedWorkspaceId = computed(() => workspaceStore.currentSelectedWorkspaceId)

const currentWorkspaceName = computed(() => {
  if (!selectedWorkspaceId.value) return null
  return workspaceStore.workspaces[selectedWorkspaceId.value]?.name
})

const currentWorkspacePath = computed(() => {
  if (!selectedWorkspaceId.value) return null
  return workspaceStore.workspaces[selectedWorkspaceId.value]?.path
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const selectWorkspace = (workspaceId: string) => {
  workspaceStore.setSelectedWorkspaceId(workspaceId)
  emit('workspace-selected', workspaceId)
  isExpanded.value = false
}
</script>

<style scoped>
.workspace-item {
  position: relative;
  overflow: hidden;
}

.workspace-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background-color: rgb(59, 130, 246, 0.1);
  transition: width 0.2s ease;
}

.workspace-item:hover::before {
  width: 100%;
}
</style>
