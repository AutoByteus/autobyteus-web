<template>
  <div 
    class="flex flex-col bg-gray-800 text-white h-full w-fit relative z-20"
  >
    <!-- Logo Container Removed -->
    
    <!-- Main Navigation -->
    <nav class="flex-1 px-2 pt-4">
      <ul class="space-y-2">
        <!-- Main workspace/agent view -->
        <li class="relative">
          <NuxtLink 
            to="/workspace"
            @click="handleWorkspaceClick"
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="[
              {'bg-gray-700': $route.path === '/workspace'},
              {'cursor-default': $route.path === '/workspace' && workspaceIconState === 'DEFAULT_ICON'}
            ]"
          >
            <transition name="icon-fade" mode="out-in">
              <!-- Default Workspace Icon -->
              <svg v-if="workspaceIconState === 'DEFAULT_ICON'" key="default" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13l.648 1.938a3.375 3.375 0 002.456 2.456L21 18l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              <!-- Uncollapse One Icon (Single Chevron) -->
              <svg v-else-if="workspaceIconState === 'UNCOLLAPSE_ONE'" key="uncollapse-one" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <!-- Uncollapse Many Icon (Double Chevron) -->
              <svg v-else-if="workspaceIconState === 'UNCOLLAPSE_MANY'" key="uncollapse-many" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </transition>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              {{ workspaceTooltip }}
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2_0 014 0zM7 10a2 2 0 11-4 0 2 2_0 014 0z"></path>
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Agents
            </span>
          </NuxtLink>
        </li>

        <li class="relative">
          <NuxtLink 
            to="/applications" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/applications')}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
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
            to="/skills" 
            class="flex justify-center items-center p-3 rounded-md hover:text-blue-300 hover:bg-gray-700 transition-colors group relative"
            :class="{'bg-gray-700': $route.path.startsWith('/skills')}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Skills
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore';
import { useWorkspaceStore } from '~/stores/workspace';

const layoutStore = useWorkspaceLeftPanelLayoutStore();
const { panels } = storeToRefs(layoutStore);
const workspaceStore = useWorkspaceStore();
const route = useRoute();
const router = useRouter();

const isProfilePanelOpen = computed(() => panels.value.launchProfile.isOpen);
const isFileExplorerOpen = computed(() => panels.value.fileExplorer.isOpen);
const activeLaunchProfileHasWorkspace = computed(() => !!workspaceStore.activeWorkspace);

const effectiveFileExplorerOpen = computed(() => !activeLaunchProfileHasWorkspace.value || isFileExplorerOpen.value);

const workspaceIconState = computed(() => {
  if (route.path !== '/workspace') {
    return 'DEFAULT_ICON';
  }

  const profileOpen = isProfilePanelOpen.value;
  const explorerOpen = effectiveFileExplorerOpen.value;

  if (profileOpen && explorerOpen) {
    return 'DEFAULT_ICON';
  } else if (!profileOpen && !explorerOpen) {
    return 'UNCOLLAPSE_MANY';
  } else {
    return 'UNCOLLAPSE_ONE';
  }
});

const workspaceTooltip = computed(() => {
  if (route.path !== '/workspace' || workspaceIconState.value === 'DEFAULT_ICON') {
    return 'Workspace';
  }

  switch(workspaceIconState.value) {
    case 'UNCOLLAPSE_MANY': return 'Show panels';
    case 'UNCOLLAPSE_ONE':
      if (!isProfilePanelOpen.value) return 'Show Profiles';
      if (!effectiveFileExplorerOpen.value) return 'Show Explorer';
      return 'Workspace';
    default: return 'Workspace';
  }
});

function handleWorkspaceClick(event: MouseEvent) {
  // If not on workspace page, allow normal navigation
  if (route.path !== '/workspace') {
    return;
  }

  // If on workspace page, prevent navigation and handle panel toggling
  event.preventDefault();

  const profileOpen = isProfilePanelOpen.value;
  const explorerOpen = effectiveFileExplorerOpen.value;
  
  // If both are open, do nothing (matching original disabled logo behavior)
  if (workspaceIconState.value === 'DEFAULT_ICON') {
    return;
  }

  // If both are collapsed, open explorer first.
  if (!profileOpen && !explorerOpen) {
    layoutStore.openPanel('fileExplorer');
  } 
  // If only one is collapsed, open that one.
  else if (!profileOpen) {
    layoutStore.openPanel('launchProfile');
  } else if (!explorerOpen) {
    layoutStore.openPanel('fileExplorer');
  }
}
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

/* Icon fade transition */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.15s ease;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}
</style>
