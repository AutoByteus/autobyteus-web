import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import RFB from '~/lib/novnc/core/rfb'; // Local ESM import

export const useVncViewerStore = defineStore('vncViewer', () => {
  const vncHost = ref('localhost');
  const vncPort = ref(6080);
  const vncPath = ref('');
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const password = ref('mysecretpassword');
  const errorMessage = ref('');
  const rfb = shallowRef<RFB | null>(null);
  const container = shallowRef<HTMLElement | null>(null);

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
      });

      rfb.value.addEventListener('connect', () => {
        connectionStatus.value = 'connected';
        errorMessage.value = '';
        console.log('Connected to VNC server');
      });
      
      rfb.value.addEventListener('disconnect', (e) => {
        connectionStatus.value = 'disconnected';
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
    setContainer,
    connect,
    disconnect,
    sendCtrlAltDel,
  };
});