<template>
  <div class="terminal-container h-full flex flex-col" ref="terminalContainer">
    <div ref="terminalElement" class="flex-1 w-full relative"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { useBashCommandStore } from '~/stores/bashCommand';
import { useWorkspaceStore } from '~/stores/workspace';

const terminalContainer = ref<HTMLDivElement | null>(null);
const terminalElement = ref<HTMLDivElement | null>(null);
const terminalInstance = ref<Terminal | null>(null);
const fitAddon = ref<FitAddon | null>(null);
const isAddonActivated = ref(false);
const bashCommandStore = useBashCommandStore();
const workspaceStore = useWorkspaceStore();

let resizeObserver: ResizeObserver | null = null;
const currentConversationId = ref<string>('default-conversation');
const commandHistory = ref<string[]>([]);
const historyIndex = ref<number>(0);
let currentCommand = '';

const prompt = computed(() => {
  const workspaceName = workspaceStore.activeWorkspace?.name || 'no-workspace';
  /* Use darker ANSI colors for Light Theme readability */
  return `\r\n\x1b[1;32m${workspaceName}\x1b[0m:\x1b[1;34m~$\x1b[0m `;
});

const writePrompt = () => {
  if (terminalInstance.value) {
    terminalInstance.value.write(prompt.value);
  }
};

const handleCommand = async (command: string) => {
  if (!terminalInstance.value) return;
  
  if (command.trim() === '') {
    writePrompt();
    return;
  }

  const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
  if (!workspaceId) {
    terminalInstance.value.writeln(`\r\n\x1b[31mError: No active workspace found.\x1b[0m`);
    writePrompt();
    return;
  }
  
  const commandKey = `${currentConversationId.value}:${Date.now()}`;

  try {
    await bashCommandStore.executeBashCommand(workspaceId, command, commandKey);
    const result = bashCommandStore.commandResults[commandKey];
    
    if (result && typeof result.message === 'string') {
        terminalInstance.value.writeln(result.message);
    } else if (result && !result.success) {
        terminalInstance.value.writeln(`\r\n\x1b[31mError: ${result.message || 'Command failed with no output.'}\x1b[0m`);
    }

  } catch (error) {
    terminalInstance.value.writeln(`\r\n\x1b[31mError: ${(error as Error).message}\x1b[0m`);
  }
  writePrompt();
};

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const initializeTerminal = () => {
  if (!terminalElement.value) return;

  try {
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
        selectionBackground: '#e5e5e6',
        
        // ANSI Colors (Light Theme Adapted)
        black: '#383a42',
        red: '#e45649',
        green: '#50a14f',
        yellow: '#986801',
        blue: '#4078f2',
        magenta: '#a626a4',
        cyan: '#0184bc',
        white: '#a0a1a7',
        
        // Bright variants
        brightBlack: '#5c6370',
        brightRed: '#ca1243',
        brightGreen: '#4078f2', // Using blue for bright green in this palette or distinct green
        brightYellow: '#c18401',
        brightBlue: '#528bff',
        brightMagenta: '#d02f74',
        brightCyan: '#0184bc',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 5000,
      disableStdin: false,
      allowProposedApi: true
    });

    fitAddon.value = new FitAddon();
    terminalInstance.value.open(terminalElement.value);
    
    // Activate Fit Addon
    try {
      fitAddon.value.activate(terminalInstance.value);
      isAddonActivated.value = true;
      fitAddon.value.fit();
    } catch (error) {
      console.warn('Error activating fit addon:', error);
      isAddonActivated.value = false;
    }

    // Activate WebGL Addon for crisp rendering
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss((e: unknown) => {
        webglAddon.dispose();
      });
      terminalInstance.value.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas/dom renderer', e);
    }

    terminalInstance.value.writeln('\x1b[1;36mWelcome to Autobyteus Terminal!\x1b[0m');
    terminalInstance.value.writeln('Type your commands and press Enter.');
    writePrompt();

    // Input Handling
    terminalInstance.value.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Backspace
      if (code === 8 || code === 127) {
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminalInstance.value?.write('\b \b');
        }
      }
      // Enter
      else if (code === 13) {
        if (currentCommand.trim().length > 0) {
          commandHistory.value.push(currentCommand);
          historyIndex.value = commandHistory.value.length;
        }
        terminalInstance.value?.write('\r\n');
        handleCommand(currentCommand);
        currentCommand = '';
      }
      // Normal character
      else {
        currentCommand += data;
        terminalInstance.value?.write(data);
      }
    });

    // Special Keys (History, etc)
    terminalInstance.value.onKey(e => {
      const ev = e.domEvent;
      
      if (ev.ctrlKey && ev.code === 'KeyC') {
        terminalInstance.value?.write('^C\r\n');
        currentCommand = '';
        writePrompt();
      }
      else if (ev.code === 'ArrowUp') {
        if (historyIndex.value > 0) {
          historyIndex.value--;
          const command = commandHistory.value[historyIndex.value];
          // Clear current line
          while (currentCommand.length > 0) {
            terminalInstance.value?.write('\b \b');
            currentCommand = currentCommand.slice(0, -1);
          }
          currentCommand = command;
          terminalInstance.value?.write(command);
        }
      }
      else if (ev.code === 'ArrowDown') {
        if (historyIndex.value < commandHistory.value.length) {
          historyIndex.value++;
          let command = '';
          if (historyIndex.value < commandHistory.value.length) {
            command = commandHistory.value[historyIndex.value];
          }
           // Clear current line
           while (currentCommand.length > 0) {
            terminalInstance.value?.write('\b \b');
            currentCommand = currentCommand.slice(0, -1);
          }
          currentCommand = command;
          terminalInstance.value?.write(command);
        }
      }
    });

  } catch (error) {
    console.error('Error initializing terminal:', error);
  }
};

const debouncedFit = debounce(() => {
  if (isAddonActivated.value && fitAddon.value) {
    try {
      fitAddon.value.fit();
    } catch (error) {
      console.warn('Error during fit:', error);
    }
  }
}, 100);

const cleanup = () => {
  if (resizeObserver && terminalContainer.value) {
    resizeObserver.unobserve(terminalContainer.value);
  }
  resizeObserver = null;
  
  terminalContainer.value?.removeEventListener('click', () => terminalInstance.value?.focus());

  try {
    if (isAddonActivated.value && fitAddon.value) {
      fitAddon.value.dispose();
    }
  } catch (error) { 
    // ignore
  }

  try {
    if (terminalInstance.value) {
      terminalInstance.value.dispose();
    }
  } catch (error) {
    // ignore
  }

  terminalInstance.value = null;
  fitAddon.value = null;
  isAddonActivated.value = false;
};

onMounted(() => {
  nextTick(() => {
    initializeTerminal();
    
    if (terminalContainer.value) {
      resizeObserver = new ResizeObserver(debouncedFit);
      resizeObserver.observe(terminalContainer.value);
    }
    
    terminalContainer.value?.addEventListener('click', () => {
      terminalInstance.value?.focus();
    });
  });
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style>
.terminal-container {
  background-color: #ffffff;
  overflow: hidden;
  height: 100%;
  cursor: text;
  padding: 0;
  box-sizing: border-box;
}

/* Ensure inner xterm div fills space */
.terminal-container .xterm-screen {
  width: 100% !important; 
}

/* Custom Scrollbar to match Light Theme */
.terminal-container ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.terminal-container ::-webkit-scrollbar-track {
  background: #ffffff; 
}

.terminal-container ::-webkit-scrollbar-thumb {
  background: #d1d5db; /* Gray-300 */
  border-radius: 0px;
}

.terminal-container ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af; /* Gray-400 */
}

.terminal-container ::-webkit-scrollbar-corner {
  background: #ffffff;
}

.xterm {
  padding: 12px 0 0 12px; /* Internal padding for text breathing room */
}
</style>
