<template>
  <div class="flex flex-col h-screen">
    <Header class="bg-black-200" />
    <main class="flex-grow bg-blue-200 overflow-hidden">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
</script>

<style>
html, body, #__nuxt {
  height: 100%;
}
</style>