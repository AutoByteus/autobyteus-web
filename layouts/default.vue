<template>
  <div class="flex flex-col h-screen h-[100dvh]">
    <!-- Mobile Header -->
    <header class="md:hidden flex-shrink-0 h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between z-30">
      <div class="flex items-center">
        <button 
          @click="appLayoutStore.toggleMobileMenu()"
          class="text-gray-400 hover:text-white focus:outline-none p-1 -ml-1"
        >
          <span class="sr-only">Open menu</span>
          <!-- Hamburger Icon -->
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="ml-3 text-white font-semibold flex-shrink-0">AutoByteus</span>
      </div>
    </header>

    <!-- Main Workspace Area -->
    <div class="flex-1 flex flex-row overflow-hidden relative">
      
      <!-- Mobile Sidebar Overlay -->
      <div 
        v-if="appLayoutStore.isMobileMenuOpen"
        class="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 md:hidden"
        @click="appLayoutStore.closeMobileMenu()"
      ></div>

      <!-- Sidebar Wrapper -->
      <aside 
        class="flex-shrink-0 absolute inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 h-full"
        :class="[
          appLayoutStore.isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <Sidebar />
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1 bg-blue-50 overflow-hidden relative z-0 w-full">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import { watch } from 'vue';
import { useAppLayoutStore } from '~/stores/appLayoutStore';
import { useRoute } from 'vue-router';

const appLayoutStore = useAppLayoutStore();
const route = useRoute();

// Close sidebar on route change
watch(
  () => route.fullPath, 
  () => {
    appLayoutStore.closeMobileMenu();
  }
);
</script>

<style>
html, body, #__nuxt {
  height: 100%;
}
</style>
