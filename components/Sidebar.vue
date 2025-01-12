<template>
  <div class="flex flex-col bg-gray-800 text-white h-full w-fit relative z-20">
    <!-- Logo Container -->
    <div class="px-4 py-4 flex justify-center">
      <img 
        src="/autobyteus-icon.svg"
        alt="AutoByteus Icon" 
        class="w-8 h-8"
      />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 mt-4">
      <ul class="space-y-2">
        <li class="relative">
          <NuxtLink 
            to="/" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path === '/'}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Home
            </span>
          </NuxtLink>
        </li>
        <li class="relative">
          <button 
            @click="toggleWorkspaceSelector"
            class="w-full flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': isWorkspaceSelectorVisible}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Workspace
            </span>
          </button>
        </li>
        <li class="relative">
          <NuxtLink 
            to="/agents" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path === '/agents'}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Agents
            </span>
          </NuxtLink>
        </li>
        <li class="relative">
          <NuxtLink 
            to="/prompt-engineering" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path === '/prompt-engineering'}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Prompt Engineering
            </span>
          </NuxtLink>
        </li>
        <li class="relative">
          <NuxtLink 
            to="/settings" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/settings')}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Settings
            </span>
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
import { NuxtLink } from '#components'
import { useWorkspaceUIStore } from '~/stores/workspaceUI'
import WorkspaceSelector from '~/components/workspace/WorkspaceSelector.vue'

const workspaceUIStore = useWorkspaceUIStore()
const isWorkspaceSelectorVisible = computed(() => workspaceUIStore.isWorkspaceSelectorVisible)

const toggleWorkspaceSelector = () => {
  workspaceUIStore.toggleWorkspaceSelector()
}

const hideWorkspaceSelector = () => {
  workspaceUIStore.hideWorkspaceSelector()
}
</script>

<style>
/* Ensure tooltips appear above other content */
.nuxt-link-exact-active::after,
.nuxt-link-active::after {
  z-index: 30;
}

/* Add tooltip styles if needed */
[title]:hover::after {
  z-index: 30;
}
</style>
