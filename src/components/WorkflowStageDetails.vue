<template>
    <div>
        <h3>Selected Stage Detail</h3>
        <p>Stage Name: {{ stageName }}</p>
        <p>Stage Class: {{ stageClass }}</p>
  
        <div>
            <h3>Fields:</h3>
            <p v-for="(field, index) in fields" :key="index">{{ field }}</p>
        </div>
  
        <div v-if="showPrompts">
            <h3>Predefined Prompts: Click to View</h3>
            <p v-for="(prompt, index) in prompts" :key="index">{{ prompt }}</p>
        </div>
  
        <button @click="startExecution">Start Execution</button>
  
        <p>Execution Status: {{ executionStatus }}</p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    props: ['stageName'],
    data() {
        return {
            fields: ['Field1', 'Field2', '...'],
            prompts: ['Prompt1', 'Prompt2', '...'],
            showPrompts: false,
            executionStatus: 'Not Started'
        }
    },
    computed: {
        stageClass() {
            return `${this.stageName}Stage`;
        }
    },
    methods: {
        startExecution() {
            this.executionStatus = 'Running';
            // ... start execution process
        }
    }
  });
  </script>
  
  <style scoped>
  .workflow-stage-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid #000;
      border-radius: 5px;
      padding: 10px;
      box-sizing: border-box;
      cursor: pointer;
      margin: 10px;
      color: white;
      background-color: #428BCA;
      word-wrap: break-word;
      transition: background-color 0.3s;
  }
  
  .workflow-stage-details:hover {
      background-color: #3276B1;
  }
  
  .workflow-stage-details h3 {
      margin: 10px 0;
  }
  
  .workflow-stage-details p {
      margin: 5px 0;
  }
  
  .workflow-stage-details button {
      margin-top: 20px;
      color: #000;
      background-color: #fff;
  }
  </style>
  