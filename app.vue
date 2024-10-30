<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app'

useHead({
  title: 'Autobyteus',
  meta: [
    { charset: 'UTF-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { hid: 'description', name: 'description', content: 'A brief description of your app.' },
    { name: 'theme-color', content: '#ffffff' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    // Add any additional meta tags as needed
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    // Add any additional link tags as needed
  ],
})
</script>

<style lang="css">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  #app {
    @apply min-h-screen font-sans;
  }
</style>