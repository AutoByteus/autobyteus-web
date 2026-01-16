<template>
  <div id="app">
    <!-- Conditionally display server status overlays in Electron environment -->
    <template v-if="serverStore.isElectron">
      <ServerLoading />
      <ServerShutdown />
    </template>
    
    <UiErrorPanel v-if="config.public.showDebugErrorPanel" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from '~/stores/serverStore'
import ServerLoading from '~/components/server/ServerLoading.vue'
import ServerShutdown from '~/components/server/ServerShutdown.vue'
import UiErrorPanel from '~/components/ui/UiErrorPanel.vue'

const config = useRuntimeConfig()
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
