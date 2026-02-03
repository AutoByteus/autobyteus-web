<template>
  <div id="app">
    <!-- Conditionally display server status overlays in Electron environment -->
    <template v-if="serverStore.isElectron">
      <ServerLoading />
      <ServerShutdown />
    </template>
    
    <UiErrorPanel v-if="config.public.showDebugErrorPanel" />
    <ToastContainer />

    <NuxtLayout v-if="isAppReady">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '~/stores/serverStore'
import ServerLoading from '~/components/server/ServerLoading.vue'
import ServerShutdown from '~/components/server/ServerShutdown.vue'
import UiErrorPanel from '~/components/ui/UiErrorPanel.vue'
import ToastContainer from '~/components/common/ToastContainer.vue'
import { ServerStatus } from '~/types/serverStatus'

const config = useRuntimeConfig()
const serverStore = useServerStore()
const isAppReady = computed(() =>
  !serverStore.isElectron || serverStore.status === ServerStatus.RUNNING
)
</script>

<style lang="css">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  #app {
    @apply min-h-screen font-sans;
  }
</style>
