<template>
  <div class="flex flex-col bg-gray-800 text-white h-full w-fit">
    <!-- Logo Container -->
    <div class="px-4 py-4 flex">
      <img 
        src="/autobyteus-icon.svg"
        alt="AutoByteus Icon" 
        class="w-8 h-8"
      />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 mt-4">
      <ul class="space-y-2">
        <li>
          <NuxtLink 
            to="/" 
            class="block px-3 py-2 rounded-md text-sm font-medium hover:text-blue-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
            :class="{'bg-gray-700': $route.path === '/'}"
          >
            Home
          </NuxtLink>
        </li>
        <li>
          <button 
            @click="toggleWorkspaceSelector"
            class="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:text-blue-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
            :class="{'bg-gray-700': isWorkspaceSelectorVisible}"
          >
            Workspace
          </button>
        </li>
        <li>
          <NuxtLink 
            to="/agents" 
            class="block px-3 py-2 rounded-md text-sm font-medium hover:text-blue-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
            :class="{'bg-gray-700': $route.path === '/agents'}"
          >
            Agents
          </NuxtLink>
        </li>
        <li>
          <NuxtLink 
            to="/prompt-engineering" 
            class="block px-3 py-2 rounded-md text-sm font-medium hover:text-blue-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
            :class="{'bg-gray-700': $route.path === '/prompt-engineering'}"
          >
            Prompt Engineering
          </NuxtLink>
        </li>
        <li>
          <NuxtLink 
            to="/settings" 
            class="block px-3 py-2 rounded-md text-sm font-medium hover:text-blue-300 hover:bg-gray-700 transition-colors whitespace-nowrap"
            :class="{'bg-gray-700': $route.path.startsWith('/settings')}"
          >
            Settings
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Workspace Selector Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isWorkspaceSelectorVisible"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
        @click.self="hideWorkspaceSelector"
      >
        <div class="bg-white rounded-md shadow p-4 w-full max-w-4xl min-w-[800px]" @click.stop>
          <WorkspaceSelector />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NuxtLink } from '#components'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'

const route = useRoute()
const workspaceUIStore = useWorkspaceUIStore()
const isWorkspaceSelectorVisible = computed(() => workspaceUIStore.isWorkspaceSelectorVisible)

const toggleWorkspaceSelector = () => {
  workspaceUIStore.toggleWorkspaceSelector()
}

const hideWorkspaceSelector = () => {
  workspaceUIStore.hideWorkspaceSelector()
}
</script>
