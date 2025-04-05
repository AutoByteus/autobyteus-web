import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import RFB from '~/lib/novnc/core/rfb'; // Local ESM import

// Import the server settings store to dynamically fetch VNC configuration
import { useServerSettingsStore } from '~/stores/serverSettings';

export const useVncViewerStore = defineStore('vncViewer', () => {
  // Runtime config is still used for other settings like the VNC password.
  const config = useRuntimeConfig();

  // Access the server settings store
  const serverSettingsStore = useServerSettingsStore();

  // Utility function to fetch a setting value by key with an optional fallback.
  function getServerSetting(key: string, fallback: string): string {
    const found = serverSettingsStore.getSettingByKey(key);
    if (!found || !found.value) {
      return fallback;
    }
    return found.value;
  }

  // Computed property to fetch the complete VNC server URL from settings.
  // It expects a setting with the key 'AUTOBYTEUS_VNC_SERVER_URL' (e.g., "ws://localhost:6080").
  // If the provided value does not start with "ws://" or "wss://", "ws://" is prepended.
  const vncServerUrl = computed(() => {
    let url = getServerSetting('AUTOBYTEUS_VNC_SERVER_URL', 'localhost:6080');
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }
    return url;
  });

  // VNC path can remain empty unless we need user customization.
  const vncPath = ref('');

  // Connection status and other store states
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const password = ref(config.public.vncPassword || 'mysecretpassword');
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
    console.log('VNC container set:', element
      ? `Container size: ${element.offsetWidth}x${element.offsetHeight}`
      : 'Container is null'
    );
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
      const wsUrl = `${vncServerUrl.value}${vncPath.value}`;
      console.log(`Connecting to VNC at ${wsUrl}`);

      rfb.value = new RFB(container.value, wsUrl, {
        credentials: { password: password.value },
        shared: true,
        scaleViewport: true,
        resizeSession: true,
        // The constructor's "viewOnly" is ignored by RFB, so we set it explicitly below.
        viewOnly: viewOnly.value,
        qualityLevel: 6,       // Higher quality (0-9, 9 being highest)
        compressionLevel: 0,   // Highest compression (0-9, 0 being highest)
        clipViewport: false,   // Don't clip the viewport
        showDotCursor: true,   // Show dot cursor when in view-only mode
        background: '#1e1e1e', // Match background color to our container
      });

      // Must set viewOnly explicitly (constructor option is not used by noVNC).
      rfb.value.viewOnly = viewOnly.value;

      rfb.value.addEventListener('connect', () => {
        connectionStatus.value = 'connected';
        errorMessage.value = '';
        console.log('Connected to VNC server');

        // Apply proper scaling after connection
        if (rfb.value) {
          rfb.value.scaleViewport = true;
          rfb.value.resizeSession = true;

          // Force a resize event to ensure scaling is applied
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

      // Resize event handler for logging purposes
      rfb.value.addEventListener('resize', () => {
        console.log('VNC resize event received from server');
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

    // If connected, update the RFB instance
    if (rfb.value) {
      rfb.value.viewOnly = viewOnly.value;
    }
  }

  return {
    // State
    connectionStatus,
    errorMessage,
    rfb,
    container,
    viewOnly,

    // Computed
    isConnected,
    isConnecting,
    statusMessage,

    // Methods
    setContainer,
    connect,
    disconnect,
    sendCtrlAltDel,
    toggleViewOnly,
  };
});
