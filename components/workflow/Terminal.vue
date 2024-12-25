
<template>
  <div class="terminal-container" ref="terminalContainer">
    <div ref="terminal"></div>
    <div class="input-line">
      <span class="prompt">user@autobyteus-web:~$</span>
      <input
        v-model="input"
        @keydown.enter="handleCommand"
        ref="inputField"
        autofocus
        class="terminal-input"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useBashCommandStore } from '~/stores/bashCommand';

const terminalContainer = ref<HTMLDivElement | null>(null);
const inputField = ref<HTMLInputElement | null>(null);
const input = ref<string>('');
const terminal = ref<Terminal | null>(null);
const fitAddon = new FitAddon();
const bashCommandStore = useBashCommandStore();

const currentConversationId = ref<string>('default-conversation');
const currentMessageIndex = ref<number>(0);

const handleCommand = async () => {
  const command = input.value.trim();
  if (command === '') return;

  terminal.value?.writeln(`user@autobyteus-web:~$ ${command}`);
  input.value = '';

  try {
    await bashCommandStore.executeBashCommand(
      'workspace-id', // Replace with actual workspace ID
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
};

onMounted(() => {
  terminal.value = new Terminal({
    cursorBlink: true,
    fontFamily: 'Courier New, monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
      selection: '#44475a'
    }
  });
  terminal.value.loadAddon(fitAddon);
  terminal.value.open(terminalContainer.value!);
  fitAddon.fit();
  terminal.value.writeln('Welcome to Autobyteus Terminal!');
  terminal.value.writeln('Type your commands below and press Enter.');
  inputField.value?.focus();

  window.addEventListener('resize', () => {
    fitAddon.fit();
  });
});

onBeforeUnmount(() => {
  terminal.value?.dispose();
});
</script>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  color: #ffffff;
  font-family: 'Courier New', Courier, monospace;
  border-radius: 5px;
  overflow: hidden;
}

.terminal-container > div {
  flex-grow: 1;
}

.input-line {
  display: flex;
  padding: 5px 10px;
  background-color: #2d2d2d;
  align-items: center;
}

.prompt {
  margin-right: 10px;
  color: #00ff00;
}

.terminal-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  outline: none;
  font-family: inherit;
  font-size: 1em;
}
</style>
