<template>
  <div>
    <!-- Tool header -->
    <div class="mb-6">
      <div class="flex items-center">
        <button @click="$emit('back')" class="mr-3 p-2 text-gray-500 hover:text-gray-700 rounded-full">
          <span class="i-heroicons-arrow-left-20-solid w-5 h-5"></span>
        </button>
        <div 
          class="flex items-center justify-center w-10 h-10 rounded-lg mr-3"
          :class="tool.isRemote ? 'bg-purple-100' : 'bg-indigo-100'"
        >
          <span 
            :class="[tool.icon || 'i-heroicons-wrench-screwdriver-20-solid', 'w-6 h-6', tool.isRemote ? 'text-purple-600' : 'text-indigo-600']"
          ></span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ tool.name }}</h1>
          <p class="text-gray-500">{{ tool.description }}</p>
        </div>
      </div>
    </div>

    <!-- Tool information -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Tool Information</h2>
        <button 
          @click="$emit('test', tool)"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <span class="i-heroicons-play-20-solid w-4 h-4 mr-1"></span>
          Test Tool
        </button>
      </div>

      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Basic Information</h3>
          <div class="bg-gray-50 rounded-md p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">Type:</span>
              <span 
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                :class="tool.isRemote ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'"
              >
                {{ tool.isRemote ? 'Remote' : 'Local' }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">Tool ID:</span>
              <span class="text-sm text-gray-700">{{ tool.id }}</span>
            </div>
            <div v-if="tool.isRemote" class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">Server:</span>
              <span class="text-sm text-gray-700">{{ tool.serverName }}</span>
            </div>
            <div v-if="tool.isRemote" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-500">Endpoint:</span>
              <span class="text-sm text-gray-700">{{ tool.endpoint || 'api/tools/' + tool.id }}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Compatibility</h3>
          <div class="bg-gray-50 rounded-md p-4">
            <div class="mb-2">
              <span class="text-sm font-medium text-gray-500 block mb-1">Compatible Models:</span>
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="model in tool.compatibleModels" 
                  :key="model" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {{ model }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500 block mb-1">Dependencies:</span>
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="dep in tool.dependencies" 
                  :key="dep" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {{ dep }}
                </span>
                <span v-if="!tool.dependencies || tool.dependencies.length === 0" class="text-xs text-gray-500 italic">
                  No dependencies
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Function Schema -->
      <div>
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Function Schema</h3>
        <div class="bg-gray-50 rounded-md p-4">
          <pre class="text-xs text-gray-700 overflow-auto">{{ JSON.stringify(tool.schema, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Authentication (For Remote Tools) -->
    <div v-if="tool.isRemote" class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Authentication</h2>
      <div class="bg-gray-50 rounded-md p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-500">Auth Type:</span>
          <span class="text-sm text-gray-700">{{ tool.authType || 'API Key' }}</span>
        </div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-500">Provider:</span>
          <span class="text-sm text-gray-700">{{ tool.providerName || 'Default Provider' }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Status:</span>
          <span 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="tool.authConfigured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
          >
            {{ tool.authConfigured ? 'Configured' : 'Not Configured' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Usage Examples -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Usage Examples</h2>
      <div class="bg-gray-50 rounded-md p-4 mb-3">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Example 1: Basic Usage</h3>
        <pre class="text-xs text-gray-700 overflow-auto">{{ getExampleCode(tool) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
});

defineEmits(['back', 'test']);

const getExampleCode = (tool) => {
  if (tool.id === 'token-counter') {
    return `// Using the Token Counter Tool
const { countTokens } = require('@autobyteus/tools');

// Count tokens for a given text
const text = "This is a sample text to count tokens.";
const model = "gpt-4";
const result = await countTokens(text, model);

console.log(\`Token count: \${result.count}\`);
// Output: Token count: 10`;
  } else if (tool.id === 'prompt-optimizer') {
    return `// Using the Prompt Optimizer Tool
const { optimizePrompt } = require('@autobyteus/tools');

// Optimize a given prompt
const prompt = "Tell me about space.";
const options = { model: "claude-3-opus", temperature: 0.7 };
const optimizedPrompt = await optimizePrompt(prompt, options);

console.log(optimizedPrompt);
// Output: Detailed and structured prompt about space`;
  } else if (tool.id === 'remote-1') {
    return `// Using the Code Analyzer Tool
const { analyzeCode } = require('@autobyteus/tools');

// Analyze code for bugs and improvements
const code = "function add(a, b) { return a + b }";
const options = { language: "javascript", checkStyle: true };
const analysis = await analyzeCode(code, options);

console.log(analysis.suggestions);
// Output: Array of suggestions for code improvement`;
  } else {
    return `// Using the ${tool.name} Tool
const { ${tool.id.replace('-', '')} } = require('@autobyteus/tools');

// Basic usage example
const result = await ${tool.id.replace('-', '')}({
  // Parameters based on tool schema
  ...toolParameters
});

console.log(result);
// Output: Tool-specific result`;
  }
};
</script>
