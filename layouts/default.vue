<template>
  <!-- Adjusting layout to place the new Sidebar on the left and the main content on the right -->
  <div class="flex flex-row h-screen">
    <Sidebar class="flex-shrink-0" />
    
    <main class="flex-1 bg-blue-200 overflow-hidden">
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
