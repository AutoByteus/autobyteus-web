<template>
  <div class="terminal-container h-full" ref="terminalContainer">
    <div ref="terminalElement"></div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineComponent } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useBashCommandStore } from '~/stores/bashCommand';

export default defineComponent({
  name: 'Terminal',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const terminalContainer = ref<HTMLDivElement | null>(null);
    const terminalElement = ref<HTMLDivElement | null>(null);
    const terminalInstance = ref<Terminal | null>(null);
    const fitAddon = ref(new FitAddon());
    const bashCommandStore = useBashCommandStore();

    const currentConversationId = ref<string>('default-conversation');
    const currentMessageIndex = ref<number>(0);

    // Add command history management
    const commandHistory = ref<string[]>([]);
    const historyIndex = ref<number>(0);
    let currentCommand = '';

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

      try {
        await bashCommandStore.executeBashCommand(
          'workspace-id',
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

    const navigateHistory = (direction: 'up' | 'down') => {
      if (!terminalInstance.value || commandHistory.value.length === 0) return;

      // Clear current line
      while (currentCommand.length > 0) {
        terminalInstance.value.write('\b \b');
        currentCommand = currentCommand.slice(0, -1);
      }

      if (direction === 'up') {
        historyIndex.value = Math.max(0, historyIndex.value - 1);
      } else {
        historyIndex.value = Math.min(commandHistory.value.length, historyIndex.value + 1);
      }

      if (historyIndex.value === commandHistory.value.length) {
        currentCommand = '';
      } else {
        currentCommand = commandHistory.value[historyIndex.value];
        terminalInstance.value.write(currentCommand);
      }
    };

    const focusTerminal = () => {
      terminalInstance.value?.focus();
    };

    // Debounce function for resize handling
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

      terminalInstance.value.loadAddon(fitAddon.value);
      terminalInstance.value.open(terminalElement.value);
      fitAddon.value.fit();

      terminalInstance.value.writeln('Welcome to Autobyteus Terminal!');
      terminalInstance.value.writeln('Type your commands and press Enter.');
      writePrompt();

      // Set up data handling for regular input
      terminalInstance.value.onData((data) => {
        const code = data.charCodeAt(0);
        
        if (code === 8 || code === 127) { // Backspace
          if (currentCommand.length > 0) {
            currentCommand = currentCommand.slice(0, -1);
            terminalInstance.value?.write('\b \b');
          }
        }
        else if (code === 13) { // Enter
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

      // Set up key handling for special keys
      terminalInstance.value.onKey(e => {
        const ev = e.domEvent;
        
        if (ev.ctrlKey && ev.code === 'KeyC') {
          terminalInstance.value?.write('^C\r\n');
          currentCommand = '';
          writePrompt();
        }
        else if (ev.code === 'ArrowUp') {
          navigateHistory('up');
        }
        else if (ev.code === 'ArrowDown') {
          navigateHistory('down');
        }
      });
    };

    watch(() => props.isVisible, (visible) => {
      if (visible) {
        nextTick(() => {
          fitAddon.value.fit();
          terminalInstance.value?.focus();
        });
      }
    });

    onMounted(() => {
      nextTick(() => {
        initializeTerminal();
        
        // Set up resize handling
        const debouncedFit = debounce(() => {
          fitAddon.value.fit();
        }, 100);
        
        window.addEventListener('resize', debouncedFit);
        terminalContainer.value?.addEventListener('click', focusTerminal);
      });
    });

    onBeforeUnmount(() => {
      terminalContainer.value?.removeEventListener('click', focusTerminal);
      window.removeEventListener('resize', () => fitAddon.value.fit());
      terminalInstance.value?.dispose();
    });

    return {
      terminalContainer,
      terminalElement,
      terminalInstance
    };
  }
});
</script>

<style>
.terminal-container {
  background-color: #1e1e1e;
  border-radius: 5px;
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
