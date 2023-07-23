<template>
    <div class="execution-logs-panel">
        <h4>Execution Logs:</h4>
        <pre v-if="logs">{{ logs }}</pre>
    </div>
  </template>
  
  <script lang="ts">
  export default {
    props: {
      logs: String
    }
  }
  </script>
  
  <style scoped>
  .execution-logs-panel {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f5f5f5;
  }
  </style>
  