<template>
  <div class="terminal-container h-full flex flex-col" ref="terminalContainer">
    <div v-if="session.errorMessage.value" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2">
      <p class="text-sm">{{ session.errorMessage.value }}</p>
      <button @click="connectTerminal" class="text-xs underline mt-1">Retry Connection</button>
    </div>
    <div ref="terminalElement" class="flex-1 w-full relative overflow-hidden"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { useWorkspaceStore } from '~/stores/workspace';
import { useTerminalSession } from '~/composables/useTerminalSession';

const terminalContainer = ref<HTMLDivElement | null>(null);
const terminalElement = ref<HTMLDivElement | null>(null);
const terminalInstance = ref<Terminal | null>(null);
const fitAddon = ref<FitAddon | null>(null);

const workspaceStore = useWorkspaceStore();

// Initialize the terminal session composable
const session = useTerminalSession({
  workspaceId: computed(() => workspaceStore.activeWorkspace?.workspaceId || '')
});

let resizeObserver: ResizeObserver | null = null;

const initializeTerminal = () => {
  if (!terminalElement.value) return;

  // Modern VS Code-like Configuration (Light Theme)
  terminalInstance.value = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.2,
    theme: {
      background: '#ffffff',
      foreground: '#383a42', // Dark gray for main text
      cursor: '#528bff',
      selectionBackground: '#e5e5e0',
      black: '#000000',
      red: '#e45649',
      green: '#50a14f',
      yellow: '#986801',
      blue: '#4078f2',
      magenta: '#a626a4',
      cyan: '#0184bc',
      white: '#a0a1a7',
      brightBlack: '#5c6370',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#e5c07b',
      brightBlue: '#61afef',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff'
    },
    scrollback: 5000,
    allowProposedApi: true
  });

  // Addons
  fitAddon.value = new FitAddon();
  terminalInstance.value.loadAddon(fitAddon.value);

  try {
    const webglAddon = new WebglAddon();
    webglAddon.onContextLoss(() => {
      webglAddon.dispose();
    });
    terminalInstance.value.loadAddon(webglAddon);
  } catch (e) {
    console.warn('WebGL addon failed to load, falling back to canvas renderer', e);
  }

  // Mount terminal
  terminalInstance.value.open(terminalElement.value);
  
  // Initial fit
  nextTick(() => {
    fitAddon.value?.fit();
  });

  // Handle Input: Send data to WebSocket
  terminalInstance.value.onData((data) => {
    if (session.isConnected.value) {
      session.sendInput(data);
    }
  });

  // Handle Resize: Send new dimensions to backend
  terminalInstance.value.onResize((size) => {
    if (session.isConnected.value) {
      session.sendResize(size.rows, size.cols);
    }
  });

  // Handle Output: Receive data from WebSocket
  session.onOutput((data) => {
    terminalInstance.value?.write(data);
  });
  
  // Clean welcome message
  terminalInstance.value.writeln('\x1b[1;34mConnected to Workspace Terminal\x1b[0m');
};

const connectTerminal = () => {
  if (workspaceStore.activeWorkspace?.workspaceId) {
    session.connect();
  }
};

const handleWindowResize = () => {
  fitAddon.value?.fit();
};

onMounted(() => {
  initializeTerminal();
  connectTerminal();

  // Watch for workspace changes to reconnect
  watch(() => workspaceStore.activeWorkspace?.workspaceId, (newId) => {
    if (newId) {
      session.disconnect();
      // Small delay to ensure clean disconnect before reconnecting
      setTimeout(() => session.connect(), 100);
    }
  });

  // Setup resize observer for the container
  if (terminalContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      fitAddon.value?.fit();
    });
    resizeObserver.observe(terminalContainer.value);
  }
  
  // Also listen for window resize
  window.addEventListener('resize', handleWindowResize);
});

onBeforeUnmount(() => {
  session.disconnect();
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', handleWindowResize);
  
  if (terminalInstance.value) {
    terminalInstance.value.dispose();
  }
});
</script>

<style scoped>
.terminal-container {
  min-height: 0;
  background-color: #ffffff;
}

/* Ensure xterm fills the container */
:deep(.xterm), :deep(.xterm-viewport), :deep(.xterm-screen) {
  width: 100% !important;
  height: 100% !important;
}

/* Scrollbar styling */
.terminal-container ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.terminal-container ::-webkit-scrollbar-track {
  background: #ffffff; 
}

.terminal-container ::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 0px;
}

.terminal-container ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.terminal-container ::-webkit-scrollbar-corner {
  background: #ffffff;
}

.xterm {
  padding: 12px 0 0 12px;
}
</style>
