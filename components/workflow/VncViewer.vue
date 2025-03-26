<template>
<div class="vnc-container h-full flex flex-col">
    <div class="connection-status py-2 px-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
      <div class="flex items-center">
        <div 
          class="status-indicator w-3 h-3 rounded-full mr-2" 
          :class="{ 'bg-red-500': !vncStore.isConnected, 'bg-yellow-500': vncStore.isConnecting, 'bg-green-500': vncStore.isConnected }"
        ></div>
        <span class="text-sm font-medium">{{ vncStore.statusMessage }}</span>
        <!-- View-only notification moved here as an inline badge -->
        <span 
          v-if="vncStore.isConnected && vncStore.viewOnly"
          class="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full"
        >
          View Only Mode
        </span>
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
      <!-- Removed the bottom notification that was blocking the scrollbar -->
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

// Set config values
vncStore.vncHost = config.public.vncHost || 'localhost';
vncStore.vncPort = config.public.vncPort || 6080;
vncStore.password = config.public.vncPassword || 'mysecretpassword';

// Add log to debug container size issues
const logContainerSize = () => {
  if (screen.value) {
    const width = screen.value.clientWidth;
    const height = screen.value.clientHeight;
    const parentWidth = screen.value.parentElement?.clientWidth;
    const parentHeight = screen.value.parentElement?.clientHeight;
    console.log(`VNC display element size: ${width}x${height}, parent: ${parentWidth}x${parentHeight}`);
  }
};

onMounted(() => {
  console.log('VNC Viewer component mounted');
  
  // Wait for DOM to settle
  nextTick(() => {
    if (screen.value) {
      // Log container size for debugging
      logContainerSize();
      
      // Set the container reference
      vncStore.setContainer(screen.value);
      
      // Wait a short delay to ensure the container is fully rendered
      setTimeout(() => {
        // Auto-connect when component is mounted
        vncStore.connect();
        
        // Log container size again after connection
        setTimeout(logContainerSize, 1000);
      }, 300);
    } else {
      console.error('Screen element not available after mount');
    }
  });
});

onBeforeUnmount(() => {
  console.log('VNC Viewer component unmounting');
  // Always disconnect when component is unmounted
  vncStore.disconnect();
});
</script>

<style>
/* Global styles to ensure scrollbars are visible on macOS - outside scoped section */
::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: rgba(180, 180, 180, 0.8);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
}

/* This forces scrollbars to be visible on macOS */
.vnc-screen::-webkit-scrollbar {
  display: block !important;
}
</style>

<style scoped>
.vnc-container { 
  background-color: #f8f9fa; 
  border-radius: 5px; 
  overflow: hidden; 
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px; /* Ensure minimum size */
}

.vnc-screen { 
  background-color: #1e1e1e; 
  position: relative; 
  flex-grow: 1;
  min-height: 200px; /* Ensure minimum size */
  overflow: scroll; /* Changed from auto to scroll to force scrollbars to appear */
  -webkit-overflow-scrolling: touch; /* Better scrolling on iOS devices */
  
  /* Force scrollbars to be always visible on macOS */
  overflow-x: scroll !important;
  overflow-y: scroll !important;
  
  /* Add bottom padding to ensure scrollbar is fully visible and not covered */
  padding-bottom: 12px;
}

/* Ensure the VNC display has correct sizing behavior */
.vnc-display {
  /* Take up at least the full container size */
  min-width: 100%;
  min-height: 100%;
  /* But also expand beyond it if needed */
  display: inline-block;
  position: relative;
}

.status-indicator { box-shadow: 0 0 4px currentColor; }
.controls button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Style scrollbars for better visibility - reverting to original light styling */
.vnc-screen::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  display: block !important; /* Explicitly force display */
}

.vnc-screen::-webkit-scrollbar-track {
  background: #f1f1f1; /* Light background for track */
  border-radius: 6px;
}

.vnc-screen::-webkit-scrollbar-thumb {
  background: #c1c1c1; /* Light gray thumb */
  border-radius: 6px;
  border: 2px solid #f1f1f1; /* Border matching track color */
}

.vnc-screen::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1; /* Slightly darker on hover */
}

/* Target macOS specifically */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .vnc-screen {
    -webkit-overflow-scrolling: auto;
    overflow-x: scroll !important;
    overflow-y: scroll !important;
  }
  
  .vnc-screen::-webkit-scrollbar {
    display: block !important;
    width: 12px;
    height: 12px;
  }
  
  /* Ensure light styling on macOS as well */
  .vnc-screen::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .vnc-screen::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border: 2px solid #f1f1f1;
  }
}
</style>
