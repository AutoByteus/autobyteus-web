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
              <!-- Default Workspace Icon -->
              <Icon v-if="workspaceIconState === 'DEFAULT_ICON'" key="default" icon="heroicons:rocket-launch" class="w-6 h-6" />
              <!-- Uncollapse One Icon (Single Chevron) -->
              <Icon v-else-if="workspaceIconState === 'UNCOLLAPSE_ONE'" key="uncollapse-one" icon="heroicons:chevron-right" class="w-6 h-6" />
              <!-- Uncollapse Many Icon (Double Chevron) -->
              <Icon v-else-if="workspaceIconState === 'UNCOLLAPSE_MANY'" key="uncollapse-many" icon="heroicons:chevron-double-right" class="w-6 h-6" />
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
            <Icon icon="heroicons:users" class="w-6 h-6" />
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
            <Icon icon="heroicons:squares-2x2" class="w-6 h-6" />
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
            <Icon icon="heroicons:light-bulb" class="w-6 h-6" />
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
            <Icon icon="heroicons:sparkles" class="w-6 h-6" />
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
            <Icon icon="heroicons:wrench-screwdriver" class="w-6 h-6" />
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
            <Icon icon="heroicons:photo" class="w-6 h-6" />
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
            <Icon icon="heroicons:cog-6-tooth" class="w-6 h-6" />
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
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore';
import { useWorkspaceStore } from '~/stores/workspace';

const layoutStore = useWorkspaceLeftPanelLayoutStore();
const { panels } = storeToRefs(layoutStore);
const workspaceStore = useWorkspaceStore();
const route = useRoute();

const isRunningPanelOpen = computed(() => panels.value.running.isOpen);
const isFileExplorerOpen = computed(() => panels.value.fileExplorer.isOpen);
const hasActiveWorkspace = computed(() => !!workspaceStore.activeWorkspace);

const effectiveFileExplorerOpen = computed(() => !hasActiveWorkspace.value || isFileExplorerOpen.value);

const workspaceIconState = computed(() => {
  if (route.path !== '/workspace') {
    return 'DEFAULT_ICON';
  }

  const profileOpen = isRunningPanelOpen.value;
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
      if (!isRunningPanelOpen.value) return 'Show Running';
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

  const profileOpen = isRunningPanelOpen.value;
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
    layoutStore.openPanel('running');
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
