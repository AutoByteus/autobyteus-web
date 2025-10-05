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

    <!-- Sidebar Toggle Button for Launch Profile Panel -->
    <button 
      v-if="route.path === '/workspace'"
      @click="toggleProfilePanel"
      class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-1 bg-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200"
    >
      <svg 
        class="w-3 h-3 transition-transform duration-200" 
        :class="{ 'rotate-180': isProfilePanelOpen }"
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
        <!-- Main workspace/agent view -->
        <li class="relative">
          <NuxtLink 
            to="/workspace"
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path === '/workspace'}"
          >
            <!-- UPDATED ICON: Changed Workspace to a "sparkles" icon to represent the AI-powered creation space. -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13l.648 1.938a3.375 3.375 0 002.456 2.456L21 18l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Workspace
            </span>
          </NuxtLink>
        </li>
        
        <li class="relative">
          <NuxtLink 
            to="/agents" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/agents')}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Agents
            </span>
          </NuxtLink>
        </li>

        <!-- Applications Link -->
        <li class="relative">
          <NuxtLink 
            to="/applications" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/applications')}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Applications
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
            :class="{'bg-gray-700': $route.path.startsWith('/tools')}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Tools
            </span>
          </NuxtLink>
        </li>

        <li class="relative">
          <NuxtLink
            to="/media"
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/media')}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Media Library
            </span>
          </NuxtLink>
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
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useLaunchProfilePanelOverlayStore } from '~/stores/launchProfilePanelOverlayStore';

const route = useRoute();
const launchProfilePanelOverlayStore = useLaunchProfilePanelOverlayStore();
const { isOpen: isProfilePanelOpen } = storeToRefs(launchProfilePanelOverlayStore);

const toggleProfilePanel = () => {
  launchProfilePanelOverlayStore.toggle();
};
</script>

<style scoped>
/* Ensure tooltips appear above other content */
.nuxt-link-exact-active::after,
.nuxt-link-active::after {
  z-index: 30;
}

[title]:hover::after {
  z-index: 30;
}
</style>
