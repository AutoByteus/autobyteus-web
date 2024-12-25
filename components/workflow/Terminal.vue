<template>
<div class="terminal-container h-full" ref="terminalContainer">
    <div ref="terminal"></div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useBashCommandStore } from '~/stores/bashCommand';

const props = defineProps<{
  isVisible: boolean;
}>();

const terminalContainer = ref<HTMLDivElement | null>(null);
const terminal = ref<Terminal | null>(null);
const fitAddon = new FitAddon();
const bashCommandStore = useBashCommandStore();

const currentConversationId = ref<string>('default-conversation');
const currentMessageIndex = ref<number>(0);

let currentCommand = '';

const handleCommand = async (command: string) => {
  if (command.trim() === '') return;

  try {
    await bashCommandStore.executeBashCommand(
      'workspace-id',
      command,
      currentConversationId.value,
      currentMessageIndex.value
    );
    const result = bashCommandStore.getCommandResult(currentConversationId.value, currentMessageIndex.value);
    if (result.success) {
      terminal.value?.writeln(result.message);
    } else {
      terminal.value?.writeln(`Error: ${result.message}`);
    }
  } catch (error) {
    terminal.value?.writeln(`Error: ${(error as Error).message}`);
  }
  terminal.value?.write('\r\nuser@autobyteus-web:~$ ');
};

// Add click handler to focus terminal
const focusTerminal = () => {
  terminal.value?.focus();
};

watch(() => props.isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      fitAddon.fit();
      terminal.value?.focus();
    });
  }
});

onMounted(() => {
  terminal.value = new Terminal({
    cursorBlink: true,
    fontFamily: 'Courier New, monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
      selection: '#44475a'
    },
    convertEol: true,    // Add this
    scrollback: 1000,    // Add this
    disableStdin: false  // Add this explicitly
  });
  
  terminal.value.loadAddon(fitAddon);
  
  // Make sure terminal is opened before adding event listeners
  terminal.value.open(terminalContainer.value!);
  fitAddon.fit();
  
  // Add click handler to terminal container
  terminalContainer.value?.addEventListener('click', focusTerminal);
  
  terminal.value.writeln('Welcome to Autobyteus Terminal!');
  terminal.value.writeln('Type your commands and press Enter.');
  terminal.value.write('\r\nuser@autobyteus-web:~$ ');

  // Set up key handling
  terminal.value.onKey(({ key, domEvent }) => {
    const ev = domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    if (ev.keyCode === 13) { // Enter
      terminal.value?.write('\r\n');
      handleCommand(currentCommand);
      currentCommand = '';
    } else if (ev.keyCode === 8) { // Backspace
      if (currentCommand.length > 0) {
        currentCommand = currentCommand.substring(0, currentCommand.length - 1);
        terminal.value?.write('\b \b');
      }
    } else if (printable) {
      currentCommand += key;
      terminal.value?.write(key);
    }
  });

  // Focus the terminal immediately
  nextTick(() => {
    terminal.value?.focus();
  });

  window.addEventListener('resize', () => {
    if (props.isVisible) {
      fitAddon.fit();
    }
  });
});

onBeforeUnmount(() => {
  // Clean up event listeners
  terminalContainer.value?.removeEventListener('click', focusTerminal);
  terminal.value?.dispose();
});
</script>

<style>
.terminal-container {
  background-color: #1e1e1e;
  border-radius: 5px;
  overflow: hidden;
  height: 100%;
  cursor: text; /* Add this to show text cursor */
}
</style>