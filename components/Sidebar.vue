<template>
  <div class="flex flex-col bg-gray-800 text-white h-full w-fit relative z-20">
    <!-- Logo Container -->
    <NuxtLink 
      to="/"
      class="px-2 py-2 hover:bg-gray-700 transition-colors group relative"
      title="Home"
    >
      <img 
        src="/autobyteus-icon.svg"
        alt="AutoByteus Icon" 
        class="w-8 h-8"
      />
      <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
        Home
      </span>
    </NuxtLink>

    <!-- Sidebar Toggle Button -->
    <button 
      @click="toggleWorkflowDisplay"
      class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-1 bg-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200"
    >
      <svg 
        class="w-3 h-3 transition-transform duration-200" 
        :class="{ 'rotate-180': isWorkflowOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>

    <!-- Main Navigation -->
    <nav class="flex-1 px-2 mt-4">
      <ul class="space-y-2">
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
            to="/tools" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path === '/tools'}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Tools
            </span>
          </NuxtLink>
        </li>

        <!-- Add Workspace Button -->
        <li class="relative">
          <button 
            @click="showAddWorkspaceForm = true"
            class="w-full flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Add Workspace
            </span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Bottom Navigation (Settings) -->
    <div class="px-2 pb-2">
      <ul class="space-y-2">
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
    </div>

    <!-- Add Workspace Form Modal -->
    <div v-if="showAddWorkspaceForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="max-w-md w-full mx-4">
        <AddWorkspaceForm 
          @close="showAddWorkspaceForm = false"
          @workspace-added="handleWorkspaceAdded"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowUIStore } from '~/stores/workflowUI'
import AddWorkspaceForm from './workspace/AddWorkspaceForm.vue'

const workflowUIStore = useWorkflowUIStore()
const { isWorkflowOpen } = storeToRefs(workflowUIStore)
const showAddWorkspaceForm = ref(false)

const toggleWorkflowDisplay = () => {
  workflowUIStore.toggleWorkflow()
}

const handleWorkspaceAdded = () => {
  showAddWorkspaceForm.value = false
}
</script>

<style scoped>
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
