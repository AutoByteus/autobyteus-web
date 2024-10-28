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

      <!-- Mobile Menu Button -->
      <button 
        @click="toggleMobileMenu"
        class="lg:hidden p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobile-menu"
      >
        <span class="sr-only">Open main menu</span>
        <svg 
          class="h-6 w-6"
          :class="{'hidden': isMobileMenuOpen, 'block': !isMobileMenuOpen}"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg
          class="h-6 w-6"
          :class="{'block': isMobileMenuOpen, 'hidden': !isMobileMenuOpen}"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center space-x-6">
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
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                      :class="{'scale-x-100': isWorkspaceSelectorVisible}">
                </span>
              </button>
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

      <!-- Mobile Navigation -->
      <div 
        id="mobile-menu"
        v-show="isMobileMenuOpen"
        class="lg:hidden fixed inset-0 z-50 bg-gray-800"
        @click.self="closeMobileMenu"
      >
        <div class="px-4 pt-20 pb-6 space-y-4">
          <nav>
            <ul class="space-y-4">
              <li>
                <NuxtLink 
                  to="/" 
                  class="block px-4 py-3 text-base font-medium hover:bg-gray-700 rounded-md transition-colors duration-200"
                  :class="{'bg-gray-700': $route.path === '/'}"
                  @click="closeMobileMenu"
                >
                  Home
                </NuxtLink>
              </li>
              <li>
                <button 
                  @click="toggleWorkspaceSelector"
                  class="w-full text-left px-4 py-3 text-base font-medium hover:bg-gray-700 rounded-md transition-colors duration-200 flex items-center justify-between"
                  :class="{'bg-gray-700': isWorkspaceSelectorVisible}"
                >
                  Workspace
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-5 w-5 transform transition-transform duration-200"
                    :class="{'rotate-180': isWorkspaceSelectorVisible}"
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </li>
              <li>
                <NuxtLink 
                  to="/agents" 
                  class="block px-4 py-3 text-base font-medium hover:bg-gray-700 rounded-md transition-colors duration-200"
                  :class="{'bg-gray-700': $route.path === '/agents'}"
                  @click="closeMobileMenu"
                >
                  Agents
                </NuxtLink>
              </li>
              <li>
                <NuxtLink 
                  to="/prompt-engineering" 
                  class="block px-4 py-3 text-base font-medium hover:bg-gray-700 rounded-md transition-colors duration-200"
                  :class="{'bg-gray-700': $route.path === '/prompt-engineering'}"
                  @click="closeMobileMenu"
                >
                  Prompt Engineering
                </NuxtLink>
              </li>
            </ul>
          </nav>
          <div class="px-4">
            <button 
              @click="handleMobileAPIKeyManager"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <span class="i-heroicons-key-20-solid w-5 h-5"></span>
              Manage API Keys
            </button>
          </div>
        </div>
      </div>
    </div>
    <Modal v-if="showAPIKeyManager" @close="toggleAPIKeyManager">
      <APIKeyManager />
    </Modal>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import APIKeyManager from '~/components/APIKeyManager.vue'
import Modal from '~/components/ui/Modal.vue'

const showAPIKeyManager = ref(false)
const isMobileMenuOpen = ref(false)
const workspaceUIStore = useWorkspaceUIStore()

const isWorkspaceSelectorVisible = computed(() => workspaceUIStore.isWorkspaceSelectorVisible)

const toggleAPIKeyManager = () => {
  showAPIKeyManager.value = !showAPIKeyManager.value
}

const toggleWorkspaceSelector = () => {
  workspaceUIStore.toggleWorkspaceSelector()
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const handleMobileAPIKeyManager = () => {
  closeMobileMenu()
  toggleAPIKeyManager()
}

// Clean up on component unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Prevent content shift when scrollbar is hidden */
.modal-open {
  padding-right: var(--scrollbar-width, 0px);
}

/* Mobile menu slide animation */
#mobile-menu {
  transition: opacity 0.2s ease-in-out;
}

#mobile-menu[v-show="false"] {
  opacity: 0;
  pointer-events: none;
}

#mobile-menu[v-show="true"] {
  opacity: 1;
}
</style>