<template>
  <Teleport to="body" :disabled="!isMaximized">
    <div class="vnc-container h-full flex flex-col" :class="{ 'vnc-maximized': isMaximized }">
      <div class="connection-status py-2 px-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <div class="flex items-center">
          <div 
            class="status-indicator w-3 h-3 rounded-full mr-2" 
            :class="{ 'bg-red-500': !vncStore.isConnected, 'bg-yellow-500': vncStore.isConnecting, 'bg-green-500': vncStore.isConnected }"
          ></div>
          <span class="text-sm font-medium">
            {{ vncStore.isConnected ? 'Connected to VNC server' : vncStore.statusMessage }}
          </span>
        </div>
        <div class="controls flex items-center space-x-2">
          <button 
            v-if="!vncStore.isConnected && !vncStore.isConnecting"
            @click="handleConnectClick" 
            class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Connect
          </button>
          <button 
            v-if="vncStore.isConnected"
            @click="handleDisconnectClick" 
            class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
          <button
            @click="toggleMaximize"
            class="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            :disabled="!vncStore.isConnected"
            :title="isMaximized ? 'Restore View (Esc)' : 'Maximize View'"
          >
            <ArrowsPointingInIcon v-if="isMaximized" class="w-4 h-4" />
            <ArrowsPointingOutIcon v-else class="w-4 h-4" />
          </button>
          <button 
            v-if="vncStore.isConnected"
            @click="vncStore.toggleViewOnly" 
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="vncStore.viewOnly ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-yellow-500 text-white hover:bg-yellow-600'"
            title="Toggle interaction mode"
          >
            {{ vncStore.viewOnly ? 'View Only' : 'Interactive' }}
          </button>
        </div>
      </div>
      <div class="vnc-screen flex-grow relative">
        <div ref="screen" class="vnc-display"></div>
        <div 
          v-if="vncStore.isConnecting" 
          class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10"
        >
          <div class="text-center">
            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-gray-700">Connecting to VNC server...</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { useVncViewerStore } from '~/stores/vncViewer';
import { useServerSettingsStore } from '~/stores/serverSettings'; // Added import
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/vue/24/outline';

const vncStore = useVncViewerStore();
const serverSettingsStore = useServerSettingsStore();
const screen = ref<HTMLElement | null>(null);
const isMaximized = ref(false);
const autoConnectEnabled = ref(true);
let settingsWatchStop: (() => void) | null = null;
let connectTimer: ReturnType<typeof setTimeout> | null = null;

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  // We assume noVNC will auto-resize with its container. 
  // The resizing of the container element should be sufficient for the noVNC instance to adapt.
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isMaximized.value = false;
  }
};

watch(isMaximized, (newValue) => {
  if (newValue) {
    window.addEventListener('keydown', handleKeydown);
  } else {
    window.removeEventListener('keydown', handleKeydown);
  }
});

const clearPendingConnection = () => {
  settingsWatchStop?.();
  settingsWatchStop = null;
  if (connectTimer) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }
};

const handleConnectClick = () => {
  autoConnectEnabled.value = true;
  vncStore.connect();
};

const handleDisconnectClick = () => {
  autoConnectEnabled.value = false;
  clearPendingConnection();
  vncStore.disconnect();
};


// Handle window resize
const handleWindowResize = () => {
  if (!vncStore.isConnected) {
    return;
  }
  console.log('VNC Viewer: Window resize event triggered');
};

onMounted(() => {
  console.log('VNC Viewer: Component mounted');
  window.addEventListener('resize', handleWindowResize);
  
  nextTick(() => {
    if (screen.value) {
      vncStore.setContainer(screen.value); // Set container once screen element is available
      
      const attemptConnection = () => {
        if (!autoConnectEnabled.value) {
          console.log('VNC Viewer: Auto-connect disabled, skipping connection attempt.');
          return;
        }
        // The 300ms delay can help ensure the container's dimensions are fully settled in the DOM,
        // which might be important for noVNC's initial scaling.
        connectTimer = setTimeout(() => {
          connectTimer = null;
          // Check if component is still mounted before connecting
          if (screen.value) { // screen.value being non-null implies component is still mounted effectively
             console.log('VNC Viewer: Attempting VNC connection via vncStore.connect()');
             vncStore.connect();
          } else {
             console.log('VNC Viewer: Connection attempt aborted, component unmounted or screen became null.');
          }
        }, 300);
      };

      // Check current state of server settings before attempting to connect
      if (serverSettingsStore.isLoading) {
        console.log('VNC Viewer: Server settings are currently loading. Waiting for completion.');
        settingsWatchStop?.();
        settingsWatchStop = watch(() => serverSettingsStore.isLoading, (newIsLoading) => {
          if (!newIsLoading) { // Finished loading
            console.log('VNC Viewer: Server settings finished loading. Proceeding with connection attempt.');
            attemptConnection();
            settingsWatchStop?.();
            settingsWatchStop = null;
          }
        });
      } else { 
        // Not currently loading. This means settings are either:
        // 1. Already loaded successfully.
        // 2. Fetch was attempted and failed (serverSettingsStore.error would be set).
        // 3. Fetch was never initiated by workspace.vue (less likely with the new change, but possible if workspace mount failed).
        if (serverSettingsStore.settings.length === 0 && !serverSettingsStore.error && !serverSettingsStore.isLoading) {
            console.warn('VNC Viewer: Server settings appear not to be loaded, and not currently loading. The fetch from workspace.vue might not have been initiated or completed. Connection attempt will proceed and may use fallback URLs.');
        } else if (serverSettingsStore.error) {
            console.error('VNC Viewer: Server settings fetch previously failed with an error. Connection attempt will proceed and may use fallback URLs.', serverSettingsStore.error);
        } else {
            console.log('VNC Viewer: Server settings are already loaded or not applicable (e.g., fetch completed). Proceeding with connection attempt.');
        }
        attemptConnection();
      }
    } else {
      console.error('VNC Viewer: Screen element not available after mount and nextTick.');
    }
  });
});

onBeforeUnmount(() => {
  console.log('VNC Viewer: Component unmounting');
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('keydown', handleKeydown);
  clearPendingConnection();
  autoConnectEnabled.value = false;
  vncStore.disconnect(); // Always disconnect when component is unmounted
});
</script>

<style scoped>
.vnc-container { 
  background-color: #1e1e1e; 
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.vnc-maximized {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 5000; /* A high z-index to appear over other UI elements */
}

.vnc-screen { 
  background-color: #1e1e1e; 
  position: relative; 
  flex-grow: 1;
  min-height: 200px;
  overflow: hidden;
}

.vnc-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; 
}

:deep(.vnc-display canvas) {
  max-width: 100%;
  object-fit: contain;
  margin-top: 0; 
}

.status-indicator { box-shadow: 0 0 4px currentColor; }
.controls button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
