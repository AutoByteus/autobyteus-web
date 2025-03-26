<template>
  <div class="vnc-container h-full flex flex-col">
    <div class="connection-status py-2 px-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
      <div class="flex items-center">
        <div 
          class="status-indicator w-3 h-3 rounded-full mr-2" 
          :class="{ 'bg-red-500': !vncStore.isConnected, 'bg-yellow-500': vncStore.isConnecting, 'bg-green-500': vncStore.isConnected }"
        ></div>
        <span class="text-sm font-medium">{{ vncStore.isConnected ? 'Connected to VNC server' : vncStore.statusMessage }}</span>
      </div>
      <div class="controls flex items-center space-x-2">
        <button 
          v-if="!vncStore.isConnected && !vncStore.isConnecting"
          @click="vncStore.connect" 
          class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Connect
        </button>
        <button 
          v-if="vncStore.isConnected"
          @click="vncStore.disconnect" 
          class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Disconnect
        </button>
        <button 
          @click="vncStore.sendCtrlAltDel" 
          class="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          :disabled="!vncStore.isConnected || vncStore.viewOnly"
          title="Send Ctrl+Alt+Del"
        >
          Ctrl+Alt+Del
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
    <div class="vnc-screen flex-grow relative" ref="vncScreenContainer">
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
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { useVncViewerStore } from '~/stores/vncViewer';
import { useRuntimeConfig } from '#app';

const vncStore = useVncViewerStore();
const config = useRuntimeConfig();
const screen = ref<HTMLElement | null>(null);
const vncScreenContainer = ref<HTMLElement | null>(null);

// Set config values
vncStore.vncHost = config.public.vncHost || 'localhost';
vncStore.vncPort = config.public.vncPort || 6080;
vncStore.password = config.public.vncPassword || 'mysecretpassword';

// Handle window resize
const handleWindowResize = () => {
  console.log('Window resize event - triggering resize');
  // Simply dispatch a resize event to let RFB handle scaling
  window.dispatchEvent(new Event('resize'));
};

onMounted(() => {
  console.log('VNC Viewer component mounted');
  
  // Add window resize listener
  window.addEventListener('resize', handleWindowResize);
  
  // Wait for DOM to settle
  nextTick(() => {
    if (screen.value) {
      // Set the container reference
      vncStore.setContainer(screen.value);
      
      // Wait a short delay to ensure the container is fully rendered
      setTimeout(() => {
        // Auto-connect when component is mounted
        vncStore.connect();
      }, 300);
    } else {
      console.error('Screen element not available after mount');
    }
  });
});

onBeforeUnmount(() => {
  console.log('VNC Viewer component unmounting');
  // Remove resize listener
  window.removeEventListener('resize', handleWindowResize);
  // Always disconnect when component is unmounted
  vncStore.disconnect();
});
</script>

<style>
/* Global styles to ensure scrollbars aren't visible */
::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 0;
  height: 0;
}
</style>

<style scoped>
.vnc-container { 
  background-color: #1e1e1e; 
  border-radius: 5px; 
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.vnc-screen { 
  background-color: #1e1e1e; 
  position: relative; 
  flex-grow: 1;
  min-height: 200px;
  overflow: hidden;
}

.vnc-display {
  /* Position at top instead of center */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Align to top */
}

:deep(.vnc-display canvas) {
  /* Allow canvas to scale properly */
  max-width: 100%;
  object-fit: contain;
  margin-top: 0; /* Ensure it sticks to the top */
  /* Don't force height to 100% to avoid stretching */
}

.status-indicator { box-shadow: 0 0 4px currentColor; }
.controls button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
