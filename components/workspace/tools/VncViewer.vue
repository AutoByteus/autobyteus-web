<template>
  <div class="vnc-viewer h-full flex flex-col bg-white">
    <div class="px-3 py-2 border-b border-gray-200"></div>

    <div class="flex-1 overflow-auto p-3">
      <div v-if="serverSettingsStore.isLoading" class="flex items-center justify-center h-full text-sm text-gray-500">
        Loading VNC settings...
      </div>
      <div v-else-if="hosts.length === 0" class="text-sm text-gray-500 space-y-2">
        <p>No VNC hosts configured.</p>
        <p class="text-xs text-gray-400">
          Add <span class="font-mono">AUTOBYTEUS_VNC_SERVER_URLS</span> as a comma-separated list (for example
          <span class="font-mono">localhost:5900,localhost:5901</span>). If not set, we fall back to
          <span class="font-mono">AUTOBYTEUS_VNC_SERVER_URL</span>.
        </p>
      </div>
      <div v-else class="vnc-stack">
        <VncHostTile
          v-for="host in hosts"
          :key="host.id"
          :host="host"
          :password="vncPassword"
          :auto-connect="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import { useServerSettingsStore } from '~/stores/serverSettings';
import VncHostTile, { type VncHostConfig } from '~/components/workspace/tools/VncHostTile.vue';
import { parseCommaSeparatedHosts } from '~/utils/vncHosts';

const serverSettingsStore = useServerSettingsStore();
const config = useRuntimeConfig();

const VNC_URLS_KEY = 'AUTOBYTEUS_VNC_SERVER_URLS';
const VNC_URL_KEY = 'AUTOBYTEUS_VNC_SERVER_URL';
const VNC_PASSWORD_KEYS = ['AUTOBYTEUS_VNC_SERVER_PASSWORD', 'AUTOBYTEUS_VNC_PASSWORD'];

const getSettingValue = (key: string) => {
  return serverSettingsStore.getSettingByKey(key)?.value?.trim() ?? '';
};

const parseHosts = (value: string): VncHostConfig[] => parseCommaSeparatedHosts(value);

const hosts = computed(() => {
  const multiValue = getSettingValue(VNC_URLS_KEY);
  if (multiValue) {
    return parseHosts(multiValue);
  }

  const singleValue = getSettingValue(VNC_URL_KEY);
  if (!singleValue) return [];
  return parseHosts(singleValue);
});

const vncPassword = computed(() => {
  const fromSettings = VNC_PASSWORD_KEYS.map(getSettingValue).find(Boolean);
  return fromSettings || config.public.vncPassword || 'mysecretpassword';
});

onMounted(async () => {
  if (serverSettingsStore.settings.length === 0 && !serverSettingsStore.isLoading) {
    try {
      await serverSettingsStore.fetchServerSettings();
    } catch (error) {
      console.error('Failed to load server settings for VNC hosts:', error);
    }
  }
  console.log('[VNC Viewer] hosts resolved', hosts.value);
});
</script>

<style scoped>
.vnc-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
