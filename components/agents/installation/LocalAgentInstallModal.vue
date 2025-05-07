<template>
  <div class="fixed inset-0 overflow-y-auto z-50">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Install Local Agent
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  You're about to install "{{ agent.name }}" to your local agents. This agent will run locally on your system.
                </p>
              </div>
            </div>
          </div>
          
          <div class="mt-5">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Agent Details</h4>
            <div class="bg-gray-50 rounded-md p-4 space-y-3">
              <div>
                <span class="text-xs text-gray-500">Role:</span>
                <p class="text-sm text-gray-900">{{ agent.role }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500">Tools Required:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span 
                    v-for="tool in agent.tools" 
                    :key="tool" 
                    class="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                  >
                    {{ tool }}
                  </span>
                </div>
              </div>
              <div v-if="installationRequirements.length > 0">
                <span class="text-xs text-gray-500">Installation Requirements:</span>
                <ul class="mt-1 space-y-1">
                  <li 
                    v-for="req in installationRequirements" 
                    :key="req" 
                    class="text-xs text-gray-600 flex items-center"
                  >
                    <svg class="h-3 w-3 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ req }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Installation Progress -->
          <div v-if="installing" class="mt-5">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                class="bg-blue-600 h-2.5 rounded-full" 
                :style="{ width: `${installProgress}%` }"
              ></div>
            </div>
            <p class="text-sm text-gray-500 mt-2">{{ installStatusMessage }}</p>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            v-if="!installing && !installComplete"
            @click="startInstallation" 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Install Agent
          </button>
          <button 
            v-if="installComplete"
            @click="completeInstallation" 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            View Agent Details
          </button>
          <button 
            v-if="!installing && !installComplete"
            @click="$emit('close')" 
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MarketplaceAgent } from '~/stores/agents';

const props = defineProps({
  agent: {
    type: Object as () => MarketplaceAgent,
    required: true
  }
});

const emit = defineEmits(['close', 'installed']);

// Installation state
const installing = ref(false);
const installComplete = ref(false);
const installProgress = ref(0);
const installStatusMessage = ref('');

// Computed installation requirements based on agent tools
const installationRequirements = computed(() => {
  const requirements = [];
  if (props.agent.tools.includes('python')) {
    requirements.push('Python 3.8+ environment');
  }
  if (props.agent.tools.includes('node')) {
    requirements.push('Node.js 14+ environment');
  }
  if (props.agent.tools.includes('docker')) {
    requirements.push('Docker container runtime');
  }
  // Add more tool-specific requirements as needed
  return requirements;
});

// Simulate installation process
function startInstallation() {
  installing.value = true;
  installProgress.value = 0;
  installStatusMessage.value = 'Preparing installation...';
  
  // Simulated installation steps
  setTimeout(() => {
    installProgress.value = 20;
    installStatusMessage.value = 'Downloading agent definition...';
    
    setTimeout(() => {
      installProgress.value = 40;
      installStatusMessage.value = 'Verifying agent compatibility...';
      
      setTimeout(() => {
        installProgress.value = 60;
        installStatusMessage.value = 'Installing required dependencies...';
        
        setTimeout(() => {
          installProgress.value = 80;
          installStatusMessage.value = 'Configuring agent settings...';
          
          setTimeout(() => {
            installProgress.value = 100;
            installStatusMessage.value = 'Installation complete!';
            installing.value = false;
            installComplete.value = true;
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

// Finalize installation and navigate to agent details
function completeInstallation() {
  emit('installed');
  emit('close');
}
</script>
