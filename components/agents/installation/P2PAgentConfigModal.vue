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
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Configure P2P Agent
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  You're about to set up "{{ agent.name }}" as a remote P2P agent. Configure connection settings below.
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
                <span class="text-xs text-gray-500">Security Level:</span>
                <p class="text-sm text-gray-900">{{ agent.p2pInfo?.securityLevel || 'Standard' }}</p>
              </div>
              <div v-if="agent.p2pInfo?.connectionRequirements">
                <span class="text-xs text-gray-500">Connection Requirements:</span>
                <ul class="mt-1 space-y-1">
                  <li 
                    v-for="req in agent.p2pInfo.connectionRequirements" 
                    :key="req" 
                    class="text-xs text-gray-600 flex items-center"
                  >
                    <svg class="h-3 w-3 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ req }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Configuration Form -->
          <div class="mt-5">
            <form @submit.prevent="saveConfig">
              <div class="mb-4">
                <label for="serverName" class="block text-sm font-medium text-gray-700">Server Name</label>
                <input 
                  type="text" 
                  id="serverName" 
                  v-model="serverName" 
                  placeholder="Enter a name for this P2P connection" 
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
              </div>
              
              <div class="mb-4">
                <label for="connectionKey" class="block text-sm font-medium text-gray-700">Connection Key</label>
                <div class="mt-1 flex rounded-md shadow-sm">
                  <input 
                    :type="showKey ? 'text' : 'password'" 
                    id="connectionKey" 
                    v-model="connectionKey" 
                    placeholder="Enter connection key" 
                    class="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                  <button 
                    type="button"
                    @click="showKey = !showKey"
                    class="-ml-px relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <svg v-if="showKey" class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="mb-4">
                <label for="endpoint" class="block text-sm font-medium text-gray-700">Server Endpoint</label>
                <input 
                  type="url" 
                  id="endpoint" 
                  v-model="endpoint" 
                  placeholder="https://example.com/api/agent" 
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
              </div>
              
              <div class="mb-4">
                <label for="accessLevel" class="block text-sm font-medium text-gray-700">Access Level</label>
                <select 
                  id="accessLevel" 
                  v-model="accessLevel" 
                  class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="read">Read Only</option>
                  <option value="readwrite">Read & Write</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
            </form>
          </div>
          
          <!-- Configuration Progress -->
          <div v-if="configuring" class="mt-5">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                class="bg-purple-600 h-2.5 rounded-full" 
                :style="{ width: `${configProgress}%` }"
              ></div>
            </div>
            <p class="text-sm text-gray-500 mt-2">{{ configStatusMessage }}</p>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            v-if="!configuring && !configComplete"
            @click="saveConfig" 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Connect Agent
          </button>
          <button 
            v-if="configComplete"
            @click="completeSetup" 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            View Agent Details
          </button>
          <button 
            v-if="!configuring && !configComplete"
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
import { ref } from 'vue';
import type { MarketplaceAgent } from '~/stores/agents';
import { useAgentsStore } from '~/stores/agents';

const props = defineProps({
  agent: {
    type: Object as () => MarketplaceAgent,
    required: true
  }
});

const emit = defineEmits(['close', 'installed']);
const agentsStore = useAgentsStore();

// Form fields
const serverName = ref(props.agent.name);
const connectionKey = ref('');
const endpoint = ref('https://p2p-agents.example.com/connect');
const accessLevel = ref('readwrite');
const showKey = ref(false);

// Configuration state
const configuring = ref(false);
const configComplete = ref(false);
const configProgress = ref(0);
const configStatusMessage = ref('');

// Simulate configuration process
function saveConfig() {
  if (!serverName.value || !connectionKey.value || !endpoint.value) {
    return; // Form validation - would show error messages in a real app
  }
  
  configuring.value = true;
  configProgress.value = 0;
  configStatusMessage.value = 'Initializing connection...';
  
  // Simulated configuration steps
  setTimeout(() => {
    configProgress.value = 25;
    configStatusMessage.value = 'Validating connection key...';
    
    setTimeout(() => {
      configProgress.value = 50;
      configStatusMessage.value = 'Establishing secure connection...';
      
      setTimeout(() => {
        configProgress.value = 75;
        configStatusMessage.value = 'Setting up agent configuration...';
        
        setTimeout(() => {
          configProgress.value = 100;
          configStatusMessage.value = 'Configuration complete!';
          
          // Create the remote agent
          const remoteAgent = {
            id: `p2p-${props.agent.id}`,
            name: props.agent.name,
            description: props.agent.description,
            icon: props.agent.icon || 'i-heroicons-server-20-solid',
            isRemote: true,
            serverId: 'p2p-server',
            serverName: serverName.value,
            role: props.agent.role,
            systemPrompt: props.agent.systemPrompt,
            tools: props.agent.tools,
            skills: props.agent.skills,
            // Add P2P specific properties
            p2pInfo: props.agent.p2pInfo
          };
          
          // Add the remote agent to the store
          agentsStore.addAgent(remoteAgent);
          
          configuring.value = false;
          configComplete.value = true;
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

// Complete setup and navigate to agent details
function completeSetup() {
  emit('installed');
  emit('close');
}
</script>
