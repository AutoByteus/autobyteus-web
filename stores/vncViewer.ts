import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import RFB from '~/lib/novnc/core/rfb'; // Local ESM import

export const useVncViewerStore = defineStore('vncViewer', () => {
  // Get values from runtime config
  const config = useRuntimeConfig();
  const vncHost = ref(config.public.vncHost);
  const vncPort = ref(config.public.vncPort);
  const vncPath = ref('');
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const password = ref('mysecretpassword');
  const errorMessage = ref('');
  const rfb = shallowRef<RFB | null>(null);
  const container = shallowRef<HTMLElement | null>(null);
  const viewOnly = ref(true); // Default to view-only mode

  const isConnected = computed(() => connectionStatus.value === 'connected');
  const isConnecting = computed(() => connectionStatus.value === 'connecting');
  const statusMessage = computed(() => {
    switch (connectionStatus.value) {
      case 'connected': return 'Connected to VNC server';
      case 'connecting': return 'Connecting to VNC server...';
      case 'disconnected': return errorMessage.value || 'Disconnected';
      default: return 'Unknown status';
    }
  });

  function setContainer(element: HTMLElement | null) {
    console.log('VNC container set:', element ? 
      `Container size: ${element.offsetWidth}x${element.offsetHeight}` : 
      'Container is null');
    container.value = element;
  }

  function connect() {
    // Don't connect if we're already connected or connecting, or if container is missing
    if (connectionStatus.value !== 'disconnected' || !container.value) {
      console.log('Not connecting: already in state:', connectionStatus.value, 'or container missing');
      return;
    }
    
    // Clean up any existing connection first
    if (rfb.value) {
      console.log('Cleaning up existing connection before connecting');
      disconnect();
    }

    connectionStatus.value = 'connecting';
    errorMessage.value = '';

    try {
      const wsUrl = `ws://${vncHost.value}:${vncPort.value}${vncPath.value}`;
      console.log(`Connecting to VNC at ${wsUrl}`);
      
      rfb.value = new RFB(container.value, wsUrl, {
        credentials: { password: password.value },
        shared: true,
        scaleViewport: true, 
        resizeSession: true,
        viewOnly: viewOnly.value, // Set initial view-only mode
        qualityLevel: 6, // Higher quality (0-9, 9 being highest)
        compressionLevel: 0, // Highest compression (0-9, 0 being highest)
        clipViewport: false, // Don't clip the viewport
        showDotCursor: true, // Show dot cursor when in view-only mode
        background: '#1e1e1e', // Match background color to our container
      });

      rfb.value.addEventListener('connect', () => {
        connectionStatus.value = 'connected';
        errorMessage.value = '';
        console.log('Connected to VNC server');
        
        // Apply proper scaling after connection
        if (rfb.value) {
          rfb.value.scaleViewport = true;
          rfb.value.resizeSession = true;
          
          // Force a resize event to make sure scaling is applied
          window.dispatchEvent(new Event('resize'));
        }
      });
      
      rfb.value.addEventListener('disconnect', (e) => {
        if (!e.detail.clean) {
          errorMessage.value = e.detail.reason || 'Disconnected unexpectedly';
          console.error('VNC disconnected with error:', e.detail);
        } else {
          console.log('VNC disconnected cleanly');
        }
        cleanupConnection();
      });
      
      rfb.value.addEventListener('credentialsrequired', () => {
        console.log('VNC credentials required');
        if (rfb.value) rfb.value.sendCredentials({ password: password.value });
      });
      
      // Add resize event handler directly to the RFB instance
      rfb.value.addEventListener('resize', () => {
        console.log('VNC resize event received from server');
        // Scaling is already handled by RFB with scaleViewport and resizeSession set during initialization
      });
    } catch (err) {
      console.error('Connection failed:', err);
      connectionStatus.value = 'disconnected';
      errorMessage.value = `Connection failed: ${err instanceof Error ? err.message : String(err)}`;
      cleanupConnection();
    }
  }

  function disconnect() {
    console.log('Disconnecting from VNC server');
    if (rfb.value) {
      try {
        rfb.value.disconnect();
      } catch (e) {
        console.warn('Error during disconnect:', e);
      }
      cleanupConnection();
    }
    connectionStatus.value = 'disconnected';
    errorMessage.value = '';
  }

  function cleanupConnection() {
    if (rfb.value) {
      console.log('Cleaning up RFB connection');
      rfb.value = null;
    }
  }

  function sendCtrlAltDel() {
    if (rfb.value && connectionStatus.value === 'connected') {
      console.log('Sending Ctrl+Alt+Del');
      rfb.value.sendCtrlAltDel();
    }
  }

  function toggleViewOnly() {
    viewOnly.value = !viewOnly.value;
    console.log(`View-only mode ${viewOnly.value ? 'enabled' : 'disabled'}`);
    
    // If we're connected, update the RFB instance
    if (rfb.value) {
      rfb.value.viewOnly = viewOnly.value;
    }
  }

  return {
    vncHost,
    vncPort,
    vncPath,
    connectionStatus,
    password,
    errorMessage,
    isConnected,
    isConnecting,
    statusMessage,
    viewOnly,
    setContainer,
    connect,
    disconnect,
    sendCtrlAltDel,
    toggleViewOnly,
    rfb, // Expose rfb for external access if needed
  };
});
