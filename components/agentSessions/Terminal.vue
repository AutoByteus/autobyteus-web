<template>
  <div class="terminal-container h-full" ref="terminalContainer">
    <div ref="terminalElement"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
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

const currentConversationId = ref<string>('default-conversation');
const currentMessageIndex = ref<number>(0);

const commandHistory = ref<string[]>([]);
const historyIndex = ref<number>(0);
let currentCommand = '';

const pendingCommand = computed(() => bashCommandStore.nextPendingCommand);

const processPendingCommand = async () => {
  if (pendingCommand.value && terminalInstance.value) {
    const command = bashCommandStore.dequeueCommand();
    if (command) {
      while (currentCommand.length > 0) {
        terminalInstance.value.write('\b \b');
        currentCommand = currentCommand.slice(0, -1);
      }
      
      currentCommand = command;
      terminalInstance.value.write(command);
    }
  }
};

const writePrompt = () => {
  if (terminalInstance.value) {
    terminalInstance.value.write('\r\nuser@autobyteus-web:~$ ');
  }
};

const handleCommand = async (command: string) => {
  if (!terminalInstance.value) return;
  
  if (command.trim() === '') {
    writePrompt();
    return;
  }

  const workspaceId = workspaceStore.currentSelectedWorkspaceId;

  try {
    await bashCommandStore.executeBashCommand(
      workspaceId,
      command,
      currentConversationId.value,
      currentMessageIndex.value
    );
    const result = bashCommandStore.getCommandResult(currentConversationId.value, currentMessageIndex.value);
    if (result.success) {
      terminalInstance.value.writeln(result.message);
    } else {
      terminalInstance.value.writeln(`Error: ${result.message}`);
    }
  } catch (error) {
    terminalInstance.value.writeln(`Error: ${(error as Error).message}`);
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
    terminalInstance.value = new Terminal({
      cursorBlink: true,
      fontFamily: 'Courier New, monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#44475a'
      },
      convertEol: true,
      scrollback: 1000,
      disableStdin: false
    });

    fitAddon.value = new FitAddon();
    terminalInstance.value.open(terminalElement.value);
    
    try {
      fitAddon.value.activate(terminalInstance.value);
      isAddonActivated.value = true;
      fitAddon.value.fit();
    } catch (error) {
      console.warn('Error activating fit addon:', error);
      isAddonActivated.value = false;
    }

    terminalInstance.value.writeln('Welcome to Autobyteus Terminal!');
    terminalInstance.value.writeln('Type your commands and press Enter.');
    writePrompt();

    terminalInstance.value.onData((data) => {
      const code = data.charCodeAt(0);
      
      if (code === 8 || code === 127) {
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminalInstance.value?.write('\b \b');
        }
      }
      else if (code === 13) {
        if (currentCommand.trim().length > 0) {
          commandHistory.value.push(currentCommand);
          historyIndex.value = commandHistory.value.length;
        }
        terminalInstance.value?.write('\r\n');
        handleCommand(currentCommand);
        currentCommand = '';
      }
      else {
        currentCommand += data;
        terminalInstance.value?.write(data);
      }
    });

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
          while (currentCommand.length > 0) {
            terminalInstance.value?.write('\b \b');
            currentCommand = currentCommand.slice(0, -1);
          }
          currentCommand = command;
          terminalInstance.value?.write(command);
        }
      }
    });

    watch(pendingCommand, () => {
      processPendingCommand();
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
  window.removeEventListener('resize', debouncedFit);
  terminalContainer.value?.removeEventListener('click', () => terminalInstance.value?.focus());

  try {
    if (isAddonActivated.value && fitAddon.value) {
      fitAddon.value.dispose();
    }
  } catch (error) {
    console.warn('Error disposing fit addon:', error);
  }

  try {
    if (terminalInstance.value) {
      terminalInstance.value.dispose();
    }
  } catch (error) {
    console.warn('Error disposing terminal:', error);
  }

  terminalInstance.value = null;
  fitAddon.value = null;
  isAddonActivated.value = false;
};

onMounted(() => {
  nextTick(() => {
    initializeTerminal();
    
    window.addEventListener('resize', debouncedFit);
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
  background-color: #1e1e1e;
  /* border-radius: 5px; Removed */
  overflow: hidden;
  height: 100%;
  cursor: text;
  padding: 10px;
  box-sizing: border-box;
}

.xterm {
  padding: 0;
}
</style>
