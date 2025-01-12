<template>
  <div class="flex flex-row h-screen">
    <!-- Added z-10 to ensure proper stacking -->
    <Sidebar class="flex-shrink-0 relative z-10" />
    
    <!-- Added z-0 to ensure main content stays below -->
    <main class="flex-1 bg-blue-200 overflow-hidden relative z-0">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue';
</script>

<style>
html, body, #__nuxt {
  height: 100%;
}
</style>
