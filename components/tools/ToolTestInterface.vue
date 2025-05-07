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
          <h1 class="text-2xl font-bold text-gray-900">Test: {{ tool.name }}</h1>
          <p class="text-gray-500">Experiment with tool parameters and execute</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Input section -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Input Parameters</h2>
        
        <div v-if="tool.schema && tool.schema.parameters" class="space-y-4">
          <div v-for="(prop, name) in tool.schema.parameters.properties" :key="name" class="mb-4">
            <label :for="name" class="block text-sm font-medium text-gray-700 mb-1">
              {{ prop.title || formatPropertyName(name) }}
              <span v-if="tool.schema.parameters.required && tool.schema.parameters.required.includes(name)" class="text-red-500">*</span>
            </label>
            
            <div class="mt-1">
              <!-- Text input -->
              <input 
                v-if="prop.type === 'string' && !prop.enum"
                :id="name"
                v-model="params[name]"
                type="text"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="prop.description || ''"
              />
              
              <!-- Number input -->
              <input 
                v-else-if="prop.type === 'number' || prop.type === 'integer'"
                :id="name"
                v-model.number="params[name]"
                type="number"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="prop.description || ''"
              />
              
              <!-- Boolean input -->
              <div v-else-if="prop.type === 'boolean'" class="flex items-center">
                <input 
                  :id="name"
                  v-model="params[name]"
                  type="checkbox"
                  class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label :for="name" class="ml-2 block text-sm text-gray-700">
                  {{ prop.description || 'Enable this option' }}
                </label>
              </div>
              
              <!-- Select input -->
              <select 
                v-else-if="prop.enum"
                :id="name"
                v-model="params[name]"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option v-for="option in prop.enum" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              
              <!-- JSON input -->
              <textarea 
                v-else-if="prop.type === 'object' || prop.type === 'array'"
                :id="name"
                v-model="params[name]"
                rows="3"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="'Enter JSON ' + prop.description || ''"
              ></textarea>
            </div>
            
            <p v-if="prop.description" class="mt-1 text-xs text-gray-500">
              {{ prop.description }}
            </p>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button 
            @click="executeTest"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="loading"
          >
            <span v-if="loading" class="i-heroicons-arrow-path-20-solid w-4 h-4 mr-1 animate-spin"></span>
            <span v-else class="i-heroicons-play-20-solid w-4 h-4 mr-1"></span>
            {{ loading ? 'Executing...' : 'Run Test' }}
          </button>
        </div>
      </div>
      
      <!-- Results section -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
        
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <span class="i-heroicons-arrow-path-20-solid w-8 h-8 text-indigo-500 mx-auto animate-spin"></span>
            <p class="mt-2 text-sm text-gray-500">Executing tool...</p>
          </div>
        </div>
        
        <div v-else-if="result" class="space-y-4">
          <div class="bg-gray-50 rounded-md p-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-sm font-medium text-gray-700">Response</h3>
              <span 
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                Success
              </span>
            </div>
            <pre class="text-xs text-gray-700 overflow-auto max-h-[400px]">{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
          
          <div class="bg-gray-50 rounded-md p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Execution Details</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="text-gray-500">Execution Time:</div>
              <div class="text-gray-700">{{ executionTime }}ms</div>
              
              <div class="text-gray-500">Timestamp:</div>
              <div class="text-gray-700">{{ new Date().toLocaleString() }}</div>
            </div>
          </div>
        </div>
        
        <div v-else-if="error" class="space-y-4">
          <div class="bg-red-50 rounded-md p-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Failed
              </span>
            </div>
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
        
        <div v-else class="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-md">
          <div class="text-center">
            <span class="i-heroicons-code-bracket-20-solid w-8 h-8 text-gray-400"></span>
            <p class="mt-2 text-sm text-gray-500">Run the test to see results</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, reactive, onMounted } from 'vue';

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
});

defineEmits(['back']);

const params = reactive({});
const loading = ref(false);
const result = ref(null);
const error = ref(null);
const executionTime = ref(0);

onMounted(() => {
  // Initialize params with default values from schema
  if (props.tool.schema && props.tool.schema.parameters && props.tool.schema.parameters.properties) {
    Object.entries(props.tool.schema.parameters.properties).forEach(([key, prop]) => {
      // Set default values
      if (prop.default !== undefined) {
        params[key] = prop.default;
      }
    });
  }
});

const formatPropertyName = (name) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const executeTest = async () => {
  loading.value = true;
  result.value = null;
  error.value = null;
  
  const startTime = performance.now();
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate fake results based on tool type
    if (props.tool.id === 'token-counter') {
      const text = params.text || '';
      result.value = {
        count: Math.ceil(text.length / 4),
        tokensByCl100k: Math.ceil(text.length / 3.5),
        tokensByGpt4: Math.ceil(text.length / 4.2),
        model: params.model || 'gpt-4',
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
    } else if (props.tool.id === 'prompt-optimizer') {
      const prompt = params.prompt || '';
      result.value = {
        originalPrompt: prompt,
        optimizedPrompt: prompt ? `Improved: ${prompt}\n\nAdditional context and structure added for better results...` : '',
        model: params.model || 'gpt-4',
        suggestions: [
          'Added more specific instructions',
          'Improved formatting for readability',
          'Added context for better understanding'
        ]
      };
    } else if (props.tool.id === 'remote-1') {
      const code = params.code || '';
      result.value = {
        analyzed: code,
        language: params.language || 'javascript',
        issues: [
          { type: 'warning', message: 'Missing semicolon', line: 1 },
          { type: 'info', message: 'Consider adding parameter types', line: 1 }
        ],
        suggestions: [
          'Add proper error handling',
          'Consider using TypeScript for better type safety',
          'Add function documentation'
        ],
        score: 85
      };
    } else if (props.tool.id === 'remote-2') {
      result.value = {
        success: true,
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [12, 19, 3, 5, 2]
            },
            {
              label: 'Dataset 2',
              data: [3, 15, 7, 4, 9]
            }
          ]
        },
        chartType: params.chartType || 'bar',
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Data Visualization'
          }
        }
      };
    } else {
      // Generic result for other tools
      result.value = {
        success: true,
        toolId: props.tool.id,
        params: { ...params },
        timestamp: new Date().toISOString(),
        message: `Successfully executed ${props.tool.name}`
      };
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while executing the tool';
  } finally {
    loading.value = false;
    executionTime.value = Math.round(performance.now() - startTime);
  }
};
</script>
