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
          Add <span class="font-mono">AUTOBYTEUS_VNC_SERVER_URLS</span> as a JSON array or newline list in Server Settings.
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

const serverSettingsStore = useServerSettingsStore();
const config = useRuntimeConfig();

const VNC_URLS_KEY = 'AUTOBYTEUS_VNC_SERVER_URLS';
const VNC_URL_KEY = 'AUTOBYTEUS_VNC_SERVER_URL';
const VNC_PASSWORD_KEYS = ['AUTOBYTEUS_VNC_SERVER_PASSWORD', 'AUTOBYTEUS_VNC_PASSWORD'];

const getSettingValue = (key: string) => {
  return serverSettingsStore.getSettingByKey(key)?.value?.trim() ?? '';
};

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('ws://') && !trimmed.startsWith('wss://')) {
    return `ws://${trimmed}`;
  }
  return trimmed;
};

const createHost = (index: number, name: string, url: string): VncHostConfig | null => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return null;
  return {
    id: `vnc-${index}`,
    name: name || `Host ${index + 1}`,
    url: normalizedUrl,
  };
};

const parseHostLine = (line: string, index: number): VncHostConfig | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.includes('|')) {
    const [name, url] = trimmed.split('|');
    return createHost(index, name.trim(), url.trim());
  }
  if (trimmed.includes('=')) {
    const [name, url] = trimmed.split('=');
    return createHost(index, name.trim(), url.trim());
  }
  return createHost(index, '', trimmed);
};

const parseHostsFromValue = (value: string): VncHostConfig[] => {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    const hostsArray = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.hosts) ? parsed.hosts : null;
    if (hostsArray) {
      return hostsArray.map((entry: any, index: number) => {
        if (typeof entry === 'string') {
          return parseHostLine(entry, index);
        }
        if (entry && typeof entry === 'object') {
          const name = String(entry.name ?? entry.label ?? entry.id ?? `Host ${index + 1}`);
          const url = String(entry.url ?? entry.host ?? entry.address ?? '');
          return createHost(index, name, url);
        }
        return null;
      }).filter((host): host is VncHostConfig => !!host);
    }
  } catch (error) {
    // Fall back to line-based parsing.
  }

  const lines = trimmed.split(/[\n,;]/);
  return lines.map((line, index) => parseHostLine(line, index)).filter((host): host is VncHostConfig => !!host);
};

const hosts = computed(() => {
  const multiValue = getSettingValue(VNC_URLS_KEY);
  if (multiValue) {
    const parsedHosts = parseHostsFromValue(multiValue);
    if (parsedHosts.length > 0) return parsedHosts;
  }

  const singleValue = getSettingValue(VNC_URL_KEY);
  if (singleValue) {
    const singleHost = createHost(0, 'Primary', singleValue);
    return singleHost ? [singleHost] : [];
  }

  return [];
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
