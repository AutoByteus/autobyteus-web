import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import RFB from '~/lib/novnc/core/rfb';

// Import the server settings store to dynamically fetch VNC configuration
import { useServerSettingsStore } from '~/stores/serverSettings';

export const useVncViewerStore = defineStore('vncViewer', () => {
  const config = useRuntimeConfig();
  const serverSettingsStore = useServerSettingsStore();

  // Utility function to fetch a setting value by key with an optional fallback.
  // This function is kept for clarity if preferred, but could be inlined in vncServerUrl.
  function getServerSetting(key: string, fallback: string): string {
    const found = serverSettingsStore.getSettingByKey(key);
    if (!found || !found.value) {
      // Log if fallback is used for the specific VNC URL key
      if (key === 'AUTOBYTEUS_VNC_SERVER_URL') {
        console.warn(`[vncViewerStore] Setting for ${key} not found or has no value. Using fallback: ${fallback}`);
      }
      return fallback;
    }
    return found.value;
  }

  const vncServerUrl = computed(() => {
    // Use the utility function or directly access serverSettingsStore.getSettingByKey
    let url = getServerSetting('AUTOBYTEUS_VNC_SERVER_URL', 'localhost:5900');
    
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }
    // Log the computed URL, source of settings, and loading state for debugging
    console.log(`[vncViewerStore] vncServerUrl computed. Value: "${url}". Settings count: ${serverSettingsStore.settings.length}, isLoading: ${serverSettingsStore.isLoading}, Error: ${serverSettingsStore.error ? serverSettingsStore.error : 'null'}`);
    return url;
  });

  const vncPath = ref(''); // VNC path can remain empty unless user customization is needed.

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
    console.log('[vncViewerStore] VNC container set:', element
      ? `Container dimensions: ${element.offsetWidth}x${element.offsetHeight}`
      : 'Container is null'
    );
    container.value = element;
  }

  function connect() {
    if (connectionStatus.value !== 'disconnected' || !container.value) {
      console.warn('[vncViewerStore] Connect called but not in disconnected state or container missing.', 
        { status: connectionStatus.value, hasContainer: !!container.value });
      if (!container.value) {
        errorMessage.value = 'VNC container not set.';
      }
      return;
    }

    // Explicitly check if server settings are still loading.
    // VncViewer.vue should ideally prevent calling connect() if settings are loading,
    // but this is an additional safeguard.
    if (serverSettingsStore.isLoading) {
        console.warn('[vncViewerStore] Connect called while server settings are still loading. Deferring may be needed or VncViewer.vue logic improved.');
        // Setting an error message or status might be appropriate here if this path is hit unexpectedly.
        // For now, it will proceed using whatever vncServerUrl.value currently is.
    }

    if (rfb.value) {
      console.log('[vncViewerStore] Cleaning up existing RFB instance before new connection attempt.');
      try {
        rfb.value.disconnect();
      } catch (e) {
        console.warn('[vncViewerStore] Error disconnecting existing RFB instance:', e);
      }
      cleanupConnection();
    }

    connectionStatus.value = 'connecting';
    errorMessage.value = '';

    try {
      // vncServerUrl is a computed property. It will have its latest value here.
      const wsUrl = `${vncServerUrl.value}${vncPath.value}`;
      console.log(`[vncViewerStore] Attempting to connect to VNC at: ${wsUrl}`);

      const sessionRfb = new RFB(container.value, wsUrl, {
        credentials: { password: password.value },
        shared: true,
        scaleViewport: true,
        resizeSession: false,
        viewOnly: viewOnly.value, // Set initial viewOnly state
        qualityLevel: 6,
        compressionLevel: 0,
        clipViewport: false,
        showDotCursor: true,
        background: '#1e1e1e',
      });

      rfb.value = sessionRfb;
      sessionRfb.viewOnly = viewOnly.value; // Ensure viewOnly is explicitly set post-construction

      sessionRfb.addEventListener('connect', () => {
        if (rfb.value !== sessionRfb) return;
        connectionStatus.value = 'connected';
        errorMessage.value = '';
        console.log('[vncViewerStore] Successfully connected to VNC server.');
        if (rfb.value) {
          rfb.value.scaleViewport = true;
          window.dispatchEvent(new Event('resize')); // Force resize to apply scaling
        }
      });

      sessionRfb.addEventListener('disconnect', (e: any) => { // Use 'any' for event detail if specific type is unknown/complex
        if (rfb.value !== sessionRfb) return;
        const reason = e.detail?.reason || 'Disconnected unexpectedly';
        if (!e.detail?.clean) {
          errorMessage.value = reason;
          console.error('[vncViewerStore] VNC disconnected with error:', reason, e.detail);
        } else {
          console.log('[vncViewerStore] VNC disconnected cleanly.');
          errorMessage.value = 'Disconnected.'; // Set a generic disconnected message
        }
        connectionStatus.value = 'disconnected';
        cleanupConnection();
      });

      sessionRfb.addEventListener('credentialsrequired', () => {
        if (rfb.value !== sessionRfb) return;
        console.log('[vncViewerStore] VNC credentialsrequired event.');
        if (rfb.value) rfb.value.sendCredentials({ password: password.value });
      });

      sessionRfb.addEventListener('resize', () => {
        if (rfb.value !== sessionRfb) return;
        console.log('[vncViewerStore] VNC resize event received from server.');
      });

    } catch (err: any) { // Catch synchronous errors from RFB constructor or setup
      console.error('[vncViewerStore] VNC connection failed during setup:', err);
      connectionStatus.value = 'disconnected';
      errorMessage.value = `Connection setup failed: ${err.message || String(err)}`;
      cleanupConnection(); // Ensure rfb is nullified
    }
  }

  function disconnect() {
    console.log('[vncViewerStore] Disconnecting from VNC server...');
    if (rfb.value) {
      try {
        rfb.value.disconnect();
      } catch (e) {
        // Log error but proceed with cleanup. RFB might throw if already disconnecting/disconnected.
        console.warn('[vncViewerStore] Error during RFB disconnect method call:', e);
      }
    }
    // Always perform cleanup, even if rfb.disconnect() threw an error or rfb.value was already null.
    cleanupConnection(); 
    connectionStatus.value = 'disconnected';
    if (!errorMessage.value || errorMessage.value === 'Connected to VNC server' || errorMessage.value === 'Connecting to VNC server...') {
        errorMessage.value = 'Disconnected'; // Set a default disconnected message if no specific error occurred.
    }
    // Do not clear errorMessage if it was set due to a disconnect error.
  }

  function cleanupConnection() {
    if (rfb.value) {
      // Remove event listeners if they were added directly to rfb instance and not auto-cleaned up.
      // NoVNC RFB class usually handles its own listener cleanup on disconnect.
      console.log('[vncViewerStore] Cleaning up RFB instance.');
      rfb.value = null;
    }
  }

  function toggleViewOnly() {
    viewOnly.value = !viewOnly.value;
    console.log(`[vncViewerStore] View-only mode toggled to: ${viewOnly.value ? 'enabled' : 'disabled'}`);
    if (rfb.value) {
      rfb.value.viewOnly = viewOnly.value;
    }
  }

  return {
    connectionStatus,
    errorMessage,
    rfb, // Exposing rfb might be for advanced use or debugging, typically not needed by components
    container, // Exposing container, similar to rfb
    viewOnly,
    isConnected,
    isConnecting,
    statusMessage,
    setContainer,
    connect,
    disconnect,
    toggleViewOnly,
  };
});
