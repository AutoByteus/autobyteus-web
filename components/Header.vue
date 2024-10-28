<template>
  <header class="bg-gray-800 text-white shadow-md">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <NuxtLink 
        to="/" 
        class="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200"
        :aria-label="'Return to home page'"
      >
        <img 
          src="/autobyteus-icon.svg"
          alt="AutoByteus Icon" 
          class="w-7 h-7"
        />
        <h1 class="text-2xl font-bold tracking-tight">AutoByteus</h1>
      </NuxtLink>
      <div class="flex items-center space-x-6">
        <nav>
          <ul class="flex space-x-6">
            <li>
              <NuxtLink 
                to="/" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group inline-flex items-center"
                :class="{'text-blue-300': $route.path === '/'}"
              >
                Home
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                      :class="{'scale-x-100': $route.path === '/'}">
                </span>
              </NuxtLink>
            </li>
            <li>
              <button 
                ref="workspaceButton"
                @click="toggleWorkspaceSelector"
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group inline-flex items-center gap-1"
                :class="{'text-blue-300': isWorkspaceSelectorVisible}"
                :aria-expanded="isWorkspaceSelectorVisible"
                aria-controls="workspace-selector"
              >
                Workspace
                <span 
                  class="transition-transform duration-200 transform"
                  :class="{'rotate-180': isWorkspaceSelectorVisible}"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-4 w-4" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fill-rule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clip-rule="evenodd" 
                    />
                  </svg>
                </span>
                <span 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                  :class="{'scale-x-100': isWorkspaceSelectorVisible}"
                >
                </span>
              </button>
              <div
                v-if="isWorkspaceSelectorVisible"
                ref="workspaceDropdown"
                id="workspace-selector"
                class="absolute top-full mt-1 w-64 transform opacity-100 scale-100 transition-all duration-200 origin-top"
              >
                <div class="relative">
                  <div class="absolute -top-2 left-5 w-3 h-3 bg-gray-700 transform rotate-45"></div>
                  <div class="relative bg-gray-700 rounded-lg shadow-lg p-2 z-10">
                    <WorkspaceSelector />
                  </div>
                </div>
              </div>
            </li>
            <li>
              <NuxtLink 
                to="/agents" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group inline-flex items-center"
                :class="{'text-blue-300': $route.path === '/agents'}"
              >
                Agents
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                      :class="{'scale-x-100': $route.path === '/agents'}">
                </span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/prompt-engineering" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group inline-flex items-center"
                :class="{'text-blue-300': $route.path === '/prompt-engineering'}"
              >
                Prompt Engineering
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                      :class="{'scale-x-100': $route.path === '/prompt-engineering'}">
                </span>
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <button 
          @click="toggleAPIKeyManager"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <span class="i-heroicons-key-20-solid w-4 h-4"></span>
          Manage API Keys
        </button>
      </div>
    </div>
    <Modal v-if="showAPIKeyManager" @close="toggleAPIKeyManager">
      <APIKeyManager />
    </Modal>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import APIKeyManager from '~/components/APIKeyManager.vue'
import Modal from '~/components/ui/Modal.vue'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'

const showAPIKeyManager = ref(false)
const workspaceUIStore = useWorkspaceUIStore()
const workspaceButton = ref<HTMLElement | null>(null)
const workspaceDropdown = ref<HTMLElement | null>(null)

const isWorkspaceSelectorVisible = computed(() => workspaceUIStore.isWorkspaceSelectorVisible)

const toggleAPIKeyManager = () => {
  showAPIKeyManager.value = !showAPIKeyManager.value
}

const toggleWorkspaceSelector = () => {
  workspaceUIStore.toggleWorkspaceSelector()
}

const handleClickOutside = (event: MouseEvent) => {
  if (!workspaceButton.value?.contains(event.target as Node) && 
      !workspaceDropdown.value?.contains(event.target as Node) && 
      isWorkspaceSelectorVisible.value) {
    workspaceUIStore.toggleWorkspaceSelector()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>