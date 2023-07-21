<template>
    <!-- Slide-down Panel for Selected Step Details -->
    <transition name="slide-fade">
      <div v-if="selectedStep" class="selected-step-details">
        <h3>Selected Step: {{ selectedStep.name }}</h3>
        <!-- Prompt Editor Integration -->
        <div v-if="selectedStep.prompt_template" class="prompt-editor-section">
          <h4>Edit Prompt:</h4>
          <PromptEditor :template="selectedStep.prompt_template" />
        </div>
        <button @click="startExecution" class="start-execution-button">Start Execution</button>
        <p>Execution Status: {{ executionStatus }}</p>
        <!-- Execution Logs Panel -->
        <div class="execution-logs-panel">
          <h4>Execution Logs:</h4>
          <pre v-if="executionLogs">{{ executionLogs }}</pre>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  import { inject, Ref, ref } from 'vue';
  import PromptEditor from './PromptEditor.vue';
  import type { Step } from '../../types/Workflow';
  
  const selectedStep = inject<Ref<Step | null>>('selectedStep')!;
  const executionStatus = ref('Not Started');
  const executionLogs = ref('');  // Placeholder for execution logs
  
  const startExecution = () => {
    executionStatus.value = 'Running';
    // ... start execution process
    // ... update executionLogs with streaming logs from the backend
  };
  </script>
  
  <!-- Existing styles for details will be kept here -->
  <style scoped>
.selected-step-details {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: opacity 0.5s, max-height 0.5s, padding 0.5s;
}

.slide-fade-enter, .slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0;
}

h3, h4 {
  color: #333;
  margin-bottom: 15px;
}

.prompt-editor-section {
  width: 100%;
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.start-execution-button {
  margin-top: 20px;
  padding: 10px 15px;
  color: #fff;
  background-color: #428BCA;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-execution-button:hover {
  background-color: #3276B1;
}

.execution-logs-panel {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f5f5f5;
}
</style>
