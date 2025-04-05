<template>
  <div id="app">
    <!-- Only display the server loading overlay in Electron environment -->
    <ServerLoading v-if="serverStore.isElectron" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from '~/stores/serverStore'
const serverStore = useServerStore()
</script>

<style lang="css">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  #app {
    @apply min-h-screen font-sans;
  }
</style>
