<template>
  <div class="terminal-container h-full flex flex-col relative group" ref="terminalContainer" :style="{ backgroundColor: currentTheme.containerBackground }">
    <!-- Theme Selector Overlay -->
    <div class="absolute top-2 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div class="relative">
        <select 
          v-model="selectedThemeId"
          @change="handleThemeChange"
          class="bg-gray-800/80 text-white text-xs rounded px-2 py-1 border border-gray-600 outline-none backdrop-blur-sm cursor-pointer hover:bg-gray-700/80"
          title="Change Terminal Theme"
        >
          <option v-for="theme in themeOptions" :key="theme.id" :value="theme.id">
            {{ theme.name }}
          </option>
        </select>
      </div>
    </div>

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
import { themes, defaultTheme, type TerminalTheme } from '~/utils/terminalThemes';

const terminalContainer = ref<HTMLDivElement | null>(null);
const terminalElement = ref<HTMLDivElement | null>(null);
const terminalInstance = ref<Terminal | null>(null);
const fitAddon = ref<FitAddon | null>(null);

const workspaceStore = useWorkspaceStore();

// Theme State
const themeOptions = Object.values(themes);
const storedThemeId = (typeof localStorage !== 'undefined') ? localStorage.getItem('terminal_theme') : null;
const selectedThemeId = ref(storedThemeId && themes[storedThemeId] ? storedThemeId : defaultTheme.id);
const currentTheme = computed(() => themes[selectedThemeId.value] || defaultTheme);

const handleThemeChange = () => {
  if (terminalInstance.value) {
    terminalInstance.value.options.theme = currentTheme.value.colors;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('terminal_theme', selectedThemeId.value);
  }
};

// Initialize the terminal session composable
const session = useTerminalSession({
  workspaceId: computed(() => workspaceStore.activeWorkspace?.workspaceId || '')
});

let resizeObserver: ResizeObserver | null = null;

const initializeTerminal = () => {
  if (!terminalElement.value) return;

  // Modern VS Code-like Configuration
  terminalInstance.value = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar', // 'block' | 'underline' | 'bar'
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.3, // Slightly more breathing room
    letterSpacing: 0,
    theme: currentTheme.value.colors, // Use reactive theme
    scrollback: 5000,
    allowProposedApi: true,
    allowTransparency: true // Allows for nice compositing if needed
  });

  // Addons
  fitAddon.value = new FitAddon();
  terminalInstance.value.loadAddon(fitAddon.value);
  
  // High-performance WebGL Rendering
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
  
  // Clean welcome message with color
  terminalInstance.value.writeln('\x1b[38;2;122;162;247m➜ Connected to Workspace Terminal\x1b[0m');
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
    resizeObserver = null;
  }
  window.removeEventListener('resize', handleWindowResize);
  
  try {
    if (fitAddon.value) {
      fitAddon.value.dispose();
    }
  } catch (e) {
    // Ignore addon disposal errors
  }

  try {
    if (terminalInstance.value) {
        terminalInstance.value.dispose();
    }
  } catch (e) {
      console.warn('Error disposing terminal:', e);
  }
});
</script>

<style scoped>
.terminal-container {
  min-height: 0;
  /* background-color handled by dynamic binding */
  transition: background-color 0.2s ease;
}

/* Ensure xterm fills the container */
:deep(.xterm), :deep(.xterm-viewport), :deep(.xterm-screen) {
  width: 100% !important;
  height: 100% !important;
}

/* Scrollbar styling - Sleek Dark/Dynamic if possible, mostly dark is standard for terminals */
.terminal-container ::-webkit-scrollbar {
  width: 8px; /* Thinner for modern look */
  height: 8px;
}

.terminal-container ::-webkit-scrollbar-track {
  background: transparent; 
}

.terminal-container ::-webkit-scrollbar-thumb {
  background: #ffffff30; /* Semi-transparent to blend with any theme */
  border-radius: 4px; /* Rounded pill scrollbar */
}

.terminal-container ::-webkit-scrollbar-thumb:hover {
  background: #ffffff50;
}

.terminal-container ::-webkit-scrollbar-corner {
  background: transparent;
}

.xterm {
  padding: 16px 0 0 16px; /* Slightly more breathing room */
}
</style>
