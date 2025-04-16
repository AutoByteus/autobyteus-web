<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-72 bg-white shadow-sm overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Tools</h2>
        
        <!-- Local Tools -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Local Tools</h3>
          <nav class="w-full">
            <ul class="w-full space-y-2">
              <li v-for="tool in localTools" :key="tool.id" class="w-full">
                <button 
                  @click="setActiveTool(tool)"
                  class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                  :class="{ 'bg-gray-100 text-gray-900': activeTool?.id === tool.id }"
                >
                  <div class="flex items-center min-w-[20px] mr-3">
                    <span :class="tool.icon || 'i-heroicons-wrench-screwdriver-20-solid' + ' w-5 h-5'"></span>
                  </div>
                  <span class="text-left">{{ tool.name }}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <!-- Remote Tools (MCP Servers) -->
        <div v-if="mcpServers.length > 0">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">MCP Servers</h3>
            <button
              @click="showAddServerForm = true"
              class="p-1 text-gray-500 hover:text-indigo-600 rounded-full"
            >
              <span class="i-heroicons-plus-circle-20-solid w-5 h-5"></span>
            </button>
          </div>
          
          <div v-for="server in mcpServers" :key="server.id" class="mb-4">
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
              <li v-for="tool in getToolsByServerId(server.id)" :key="tool.id" class="border-t border-gray-200 first:border-t-0">
                <button 
                  @click="setActiveTool(tool)"
                  class="flex w-full items-center justify-start px-4 py-2 transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                  :class="{ 'bg-gray-100 text-gray-900': activeTool?.id === tool.id }"
                >
                  <div class="flex items-center min-w-[20px] mr-3">
                    <span :class="tool.icon || 'i-heroicons-wrench-screwdriver-20-solid' + ' w-5 h-5'"></span>
                  </div>
                  <span class="text-left">{{ tool.name }}</span>
                </button>
              </li>
              <li v-if="getToolsByServerId(server.id).length === 0" class="px-4 py-2 text-sm text-gray-500 italic">
                No tools available
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Add Server Button (when no servers) -->
        <div v-else class="mt-4">
          <button
            @click="showAddServerForm = true"
            class="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-indigo-600 hover:border-indigo-300"
          >
            <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2"></span>
            <span>Add MCP Server</span>
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
          server-type="mcp"
          @submit="handleServerFormSubmit"
          @cancel="cancelServerForm"
        />
      </div>
      
      <!-- Tool Content -->
      <div v-else-if="activeTool" class="max-w-7xl mx-auto p-6">
        <div class="mb-4">
          <div class="flex items-center">
            <div 
              class="flex items-center justify-center w-10 h-10 rounded-lg mr-3"
              :class="activeTool.isRemote ? 'bg-purple-100' : 'bg-indigo-100'"
            >
              <span 
                :class="[activeTool.icon || 'i-heroicons-wrench-screwdriver-20-solid', 'w-6 h-6', activeTool.isRemote ? 'text-purple-600' : 'text-indigo-600']"
              ></span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ activeTool.name }}</h1>
              <p class="text-gray-500">{{ activeTool.description }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="activeTool.id === 'token-counter'">
          <TokenCounter />
        </div>
        <div v-else class="bg-white rounded-lg shadow-sm p-6">
          <p class="text-gray-500 mb-4">
            This is a placeholder for the {{ activeTool.name }} tool interface.
          </p>
          <div class="flex items-center text-sm text-gray-500">
            <span 
              v-if="activeTool.isRemote" 
              class="flex items-center mr-3"
            >
              <span class="i-heroicons-server-20-solid w-4 h-4 mr-1"></span>
              Provided by {{ activeTool.serverName }}
            </span>
            <span class="flex items-center">
              <span class="i-heroicons-information-circle-20-solid w-4 h-4 mr-1"></span>
              Tool ID: {{ activeTool.id }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Server Management Section -->
      <div v-else-if="showServerManagement" class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">MCP Server Management</h1>
          <p class="text-gray-500">
            Connect to MCP servers to access additional remote tools and capabilities.
          </p>
        </div>
        
        <ServerList 
          :servers="mcpServers" 
          server-type="mcp" 
          title="MCP Servers"
          @add="showAddServerForm = true"
          @edit="editServer"
          @delete="deleteServer"
        />
      </div>
      
      <!-- Tools Dashboard -->
      <div v-else class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Tools Dashboard</h1>
            <p class="text-gray-500">Access all available tools in one place</p>
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
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2 inline-block"></span>
              Add Server
            </button>
          </div>
        </div>
        
        <!-- Local Tools Section -->
        <div class="mb-8">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Local Tools</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard 
              v-for="tool in localTools" 
              :key="tool.id" 
              :tool="tool"
              @run="setActiveTool(tool)"
            />
            <div v-if="localTools.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
              <span class="i-heroicons-face-frown-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
              <p class="text-gray-500">No local tools available</p>
            </div>
          </div>
        </div>
        
        <!-- Remote Tools Section -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Remote Tools</h2>
          <div v-for="server in mcpServers" :key="server.id" class="mb-6">
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
              <ToolCard 
                v-for="tool in getToolsByServerId(server.id)" 
                :key="tool.id" 
                :tool="tool"
                @run="setActiveTool(tool)"
              />
              <div v-if="getToolsByServerId(server.id).length === 0" class="col-span-full text-center py-6 bg-white rounded-lg border border-gray-200">
                <p class="text-gray-500">No tools available from this server</p>
              </div>
            </div>
          </div>
          
          <div v-if="mcpServers.length === 0" class="text-center py-8 bg-white rounded-lg border border-gray-200">
            <span class="i-heroicons-server-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
            <p class="text-gray-500 mb-2">No MCP servers connected</p>
            <button
              @click="showAddServerForm = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
              Add MCP Server
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TokenCounter from '~/components/tools/TokenCounter.vue';
import ToolCard from '~/components/tools/ToolCard.vue';
import ServerForm from '~/components/servers/ServerForm.vue';
import ServerList from '~/components/servers/ServerList.vue';
import { useServersStore } from '~/stores/servers';
import { useToolsStore } from '~/stores/tools';

definePageMeta({
  title: 'Tools',
  description: 'Access local and remote tools'
});

// Store references
const serversStore = useServersStore();
const toolsStore = useToolsStore();

// Server management
const mcpServers = computed(() => serversStore.mcpServers);
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
  // Remove tools associated with this server
  toolsStore.deleteToolsByServerId(serverId);
  
  // Remove the server itself
  serversStore.deleteServer(serverId);
};

const cancelServerForm = () => {
  showAddServerForm.value = false;
  editingServer.value = null;
};

// Tool management
const localTools = computed(() => toolsStore.localTools);
const remoteTools = computed(() => toolsStore.remoteTools);
const getToolsByServerId = (serverId) => toolsStore.getToolsByServerId(serverId);

const activeTool = ref(null);
const setActiveTool = (tool) => {
  activeTool.value = tool;
  showServerManagement.value = false;
};
</script>
