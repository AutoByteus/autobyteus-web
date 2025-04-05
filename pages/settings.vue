<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Settings</h2>
        <nav class="w-full">
          <ul class="w-full space-y-2">
            <li class="w-full">
              <button 
                @click="activeSection = 'api-keys'"
                class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'api-keys' }"
              >
                <div class="flex items-center min-w-[20px] mr-3">
                  <span class="i-heroicons-key-20-solid w-5 h-5"></span>
                </div>
                <span class="text-left">API Keys</span>
              </button>
            </li>
            <li class="w-full">
              <button 
                @click="activeSection = 'token-usage'"
                class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'token-usage' }"
              >
                <div class="flex items-center min-w-[20px] mr-3">
                  <span class="i-heroicons-chart-bar-20-solid w-5 h-5"></span>
                </div>
                <span class="text-left">Token Usage Statistics</span>
              </button>
            </li>
            <li class="w-full">
              <button 
                @click="activeSection = 'server-settings'"
                class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'server-settings' }"
              >
                <div class="flex items-center min-w-[20px] mr-3">
                  <span class="i-heroicons-server-20-solid w-5 h-5"></span>
                </div>
                <span class="text-left">Server Settings</span>
              </button>
            </li>
            <!-- New Server Status Button -->
            <li class="w-full">
              <button 
                @click="activeSection = 'server-status'"
                class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'server-status' }"
              >
                <div class="flex items-center min-w-[20px] mr-3">
                  <span 
                    :class="{
                      'i-heroicons-check-circle-20-solid': serverStore.status === 'running',
                      'i-heroicons-clock-20-solid': serverStore.status === 'starting',
                      'i-heroicons-exclamation-circle-20-solid': serverStore.status === 'error'
                    }"
                    class="w-5 h-5"
                    :style="{
                      color: serverStore.status === 'running' ? '#10B981' : 
                             serverStore.status === 'starting' ? '#F59E0B' : 
                             '#EF4444'
                    }"
                  ></span>
                </div>
                <span class="text-left">Server Status</span>
                <div v-if="serverStore.status !== 'running'" class="ml-2 w-2 h-2 rounded-full"
                     :class="{
                       'bg-yellow-500': serverStore.status === 'starting',
                       'bg-red-500': serverStore.status === 'error'
                     }">
                </div>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Content section -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6">
        <ProviderAPIKeyManager v-if="activeSection === 'api-keys'" />
        <TokenUsageStatistics v-if="activeSection === 'token-usage'" />
        <ServerSettingsManager v-if="activeSection === 'server-settings'" />
        <ServerMonitor v-if="activeSection === 'server-status'" />
        <div v-else-if="activeSection === ''" class="text-center text-gray-500 mt-12">
          <span class="i-heroicons-cog-8-tooth-20-solid w-12 h-12 mx-auto mb-4"></span>
          <h3 class="text-xl font-medium mb-2">Settings</h3>
          <p>Select a settings category from the sidebar to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useServerStore } from '~/stores/serverStore';
import ProviderAPIKeyManager from '~/components/settings/ProviderAPIKeyManager.vue';
import TokenUsageStatistics from '~/components/settings/TokenUsageStatistics.vue';
import ServerSettingsManager from '~/components/settings/ServerSettingsManager.vue';
import ServerMonitor from '~/components/server/ServerMonitor.vue';

const route = useRoute();
const serverStore = useServerStore();
const activeSection = ref('api-keys');

onMounted(() => {
  // Check for section query parameter
  const sectionParam = route.query.section as string;
  if (sectionParam) {
    activeSection.value = sectionParam;
  }
  
  // If server is not running and we are in Electron mode, default to server-status section
  if (serverStore.isElectron && serverStore.status !== 'running') {
    activeSection.value = 'server-status';
  }
});
</script>
