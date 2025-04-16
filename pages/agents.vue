<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-72 bg-white shadow-sm overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">AI Agents</h2>
        
        <!-- Local Agents -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Local Agents</h3>
          <nav class="w-full">
            <ul class="w-full space-y-2">
              <li v-for="agent in localAgents" :key="agent.id" class="w-full">
                <button 
                  @click="setActiveAgent(agent)"
                  class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                  :class="{ 'bg-gray-100 text-gray-900': activeAgent?.id === agent.id }"
                >
                  <div class="flex items-center min-w-[20px] mr-3">
                    <span :class="agent.icon || 'i-heroicons-cpu-chip-20-solid' + ' w-5 h-5'"></span>
                  </div>
                  <span class="text-left">{{ agent.name }}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <!-- Remote Agents (Agent Servers) -->
        <div v-if="agentServers.length > 0">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Agent Servers</h3>
            <button
              @click="showAddServerForm = true"
              class="p-1 text-gray-500 hover:text-blue-600 rounded-full"
            >
              <span class="i-heroicons-plus-circle-20-solid w-5 h-5"></span>
            </button>
          </div>
          
          <div v-for="server in agentServers" :key="server.id" class="mb-4">
            <div class="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-t-md">
              <div class="flex items-center">
                <span 
                  class="w-2 h-2 rounded-full mr-2"
                  :class="server.status === 'connected' ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                <span class="font-medium text-sm">{{ server.name }}</span>
              </div>
              <div class="flex space-x-1">
                <button
                  @click="editServer(server)"
                  class="p-1 text-gray-500 hover:text-gray-700 rounded-full"
                >
                  <span class="i-heroicons-cog-6-tooth-20-solid w-4 h-4"></span>
                </button>
                <button
                  @click="deleteServer(server.id)"
                  class="p-1 text-gray-500 hover:text-red-500 rounded-full"
                >
                  <span class="i-heroicons-trash-20-solid w-4 h-4"></span>
                </button>
              </div>
            </div>
            
            <ul class="border border-gray-200 rounded-b-md mb-2">
              <li v-for="agent in getAgentsByServerId(server.id)" :key="agent.id" class="border-t border-gray-200 first:border-t-0">
                <button 
                  @click="setActiveAgent(agent)"
                  class="flex w-full items-center justify-start px-4 py-2 transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                  :class="{ 'bg-gray-100 text-gray-900': activeAgent?.id === agent.id }"
                >
                  <div class="flex items-center min-w-[20px] mr-3">
                    <span :class="agent.icon || 'i-heroicons-cpu-chip-20-solid' + ' w-5 h-5'"></span>
                  </div>
                  <span class="text-left">{{ agent.name }}</span>
                </button>
              </li>
              <li v-if="getAgentsByServerId(server.id).length === 0" class="px-4 py-2 text-sm text-gray-500 italic">
                No agents available
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Add Server Button (when no servers) -->
        <div v-else class="mt-4">
          <button
            @click="showAddServerForm = true"
            class="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-blue-600 hover:border-blue-300"
          >
            <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2"></span>
            <span>Add Agent Server</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content section -->
    <div class="flex-1 overflow-auto">
      <!-- Server Management -->
      <div v-if="showAddServerForm || editingServer" class="max-w-2xl mx-auto p-6">
        <ServerForm
          :initial-data="editingServer || {}"
          server-type="agent"
          @submit="handleServerFormSubmit"
          @cancel="cancelServerForm"
        />
      </div>
      
      <!-- Agent Content -->
      <div v-else-if="activeAgent" class="max-w-7xl mx-auto p-6">
        <div class="mb-4">
          <div class="flex items-center">
            <div 
              class="flex items-center justify-center w-10 h-10 rounded-lg mr-3"
              :class="activeAgent.isRemote ? 'bg-purple-100' : 'bg-blue-100'"
            >
              <span 
                :class="[activeAgent.icon || 'i-heroicons-cpu-chip-20-solid', 'w-6 h-6', activeAgent.isRemote ? 'text-purple-600' : 'text-blue-600']"
              ></span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ activeAgent.name }}</h1>
              <p class="text-gray-500">{{ activeAgent.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6">
          <p class="text-gray-500 mb-4">
            This is a placeholder for the {{ activeAgent.name }} agent interface.
          </p>
          <div class="flex items-center text-sm text-gray-500">
            <span 
              v-if="activeAgent.isRemote" 
              class="flex items-center mr-3"
            >
              <span class="i-heroicons-server-20-solid w-4 h-4 mr-1"></span>
              Provided by {{ activeAgent.serverName }}
            </span>
            <span class="flex items-center">
              <span class="i-heroicons-information-circle-20-solid w-4 h-4 mr-1"></span>
              Agent ID: {{ activeAgent.id }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Server Management Section -->
      <div v-else-if="showServerManagement" class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Agent Server Management</h1>
          <p class="text-gray-500">
            Connect to Agent servers to access additional remote agents and capabilities.
          </p>
        </div>
        
        <ServerList 
          :servers="agentServers" 
          server-type="agent" 
          title="Agent Servers"
          @add="showAddServerForm = true"
          @edit="editServer"
          @delete="deleteServer"
        />
      </div>
      
      <!-- Agents Dashboard -->
      <div v-else class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">AI Agents</h1>
            <p class="text-gray-500">Access local and remote AI agents to help with your tasks</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showServerManagement = true"
              class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span class="i-heroicons-server-20-solid w-5 h-5 mr-2 inline-block"></span>
              Manage Servers
            </button>
            <button
              @click="showAddServerForm = true"
              class="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2 inline-block"></span>
              Add Server
            </button>
          </div>
        </div>
        
        <!-- Local Agents Section -->
        <div class="mb-8">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Local Agents</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AgentCard 
              v-for="agent in localAgents" 
              :key="agent.id" 
              :agent="agent"
              @run="setActiveAgent(agent)"
            />
            <div v-if="localAgents.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
              <span class="i-heroicons-face-frown-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
              <p class="text-gray-500">No local agents available</p>
            </div>
          </div>
        </div>
        
        <!-- Remote Agents Section -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Remote Agents</h2>
          <div v-for="server in agentServers" :key="server.id" class="mb-6">
            <div class="flex items-center mb-3">
              <h3 class="text-md font-medium text-gray-700">{{ server.name }}</h3>
              <span 
                class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="server.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ server.status === 'connected' ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentCard 
                v-for="agent in getAgentsByServerId(server.id)" 
                :key="agent.id" 
                :agent="agent"
                @run="setActiveAgent(agent)"
              />
              <div v-if="getAgentsByServerId(server.id).length === 0" class="col-span-full text-center py-6 bg-white rounded-lg border border-gray-200">
                <p class="text-gray-500">No agents available from this server</p>
              </div>
            </div>
          </div>
          
          <div v-if="agentServers.length === 0" class="text-center py-8 bg-white rounded-lg border border-gray-200">
            <span class="i-heroicons-server-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
            <p class="text-gray-500 mb-2">No Agent servers connected</p>
            <button
              @click="showAddServerForm = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
              Add Agent Server
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AgentCard from '~/components/agents/AgentCard.vue';
import ServerForm from '~/components/servers/ServerForm.vue';
import ServerList from '~/components/servers/ServerList.vue';
import { useServersStore } from '~/stores/servers';
import { useAgentsStore } from '~/stores/agents';

definePageMeta({
  title: 'AI Agents',
  description: 'Access local and remote AI agents'
});

// Store references
const serversStore = useServersStore();
const agentsStore = useAgentsStore();

// Server management
const agentServers = computed(() => serversStore.agentServers);
const showAddServerForm = ref(false);
const showServerManagement = ref(false);
const editingServer = ref(null);

const handleServerFormSubmit = (server) => {
  if (editingServer.value) {
    serversStore.updateServer(server);
  } else {
    serversStore.addServer(server);
  }
  showAddServerForm.value = false;
  editingServer.value = null;
};

const editServer = (server) => {
  editingServer.value = { ...server };
  showAddServerForm.value = true;
  showServerManagement.value = false;
};

const deleteServer = (serverId) => {
  // Remove agents associated with this server
  agentsStore.deleteAgentsByServerId(serverId);
  
  // Remove the server itself
  serversStore.deleteServer(serverId);
};

const cancelServerForm = () => {
  showAddServerForm.value = false;
  editingServer.value = null;
};

// Agent management
const localAgents = computed(() => agentsStore.localAgents);
const remoteAgents = computed(() => agentsStore.remoteAgents);
const getAgentsByServerId = (serverId) => agentsStore.getAgentsByServerId(serverId);

const activeAgent = ref(null);
const setActiveAgent = (agent) => {
  activeAgent.value = agent;
  showServerManagement.value = false;
};
</script>
