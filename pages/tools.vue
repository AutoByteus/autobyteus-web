<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar Component -->
    <ToolsSidebar
      :active-page="activePage"
      @navigate="handleNavigation"
    />

    <!-- Content section -->
    <div class="flex-1 overflow-auto">
      <!-- Tool Testing Interface -->
      <div v-if="testingTool" class="max-w-7xl mx-auto p-6">
        <ToolTestInterface
          :tool="testingTool"
          @back="testingTool = null"
        />
      </div>
      
      <!-- Tool Details -->
      <div v-else-if="selectedTool" class="max-w-7xl mx-auto p-6">
        <ToolDetails
          :tool="selectedTool"
          @back="selectedTool = null"
          @test="startToolTest"
        />
      </div>
      
      <!-- Server Management -->
      <div v-else-if="showAddServerForm || editingServer" class="max-w-2xl mx-auto p-6">
        <ServerForm
          :initial-data="editingServer || {}"
          server-type="mcp"
          @submit="handleServerFormSubmit"
          @cancel="cancelServerForm"
        />
      </div>
      
      <!-- Settings Page -->
      <div v-else-if="activePage === 'settings'" class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p class="text-gray-500">
            Manage servers and configurations
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
      
      <!-- Local Tools Page -->
      <div v-else-if="activePage === 'local-tools'" class="max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Local Tools</h1>
            <p class="text-gray-500">Tools that run on your local machine</p>
          </div>
        </div>
        
        <ToolList
          title="Available Tools"
          :tools="localTools"
          @run="startToolTest"
          @details="viewToolDetails"
        />
      </div>
      
      <!-- Remote Tools Page -->
      <div v-else-if="activePage === 'remote-tools'" class="max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Remote Tools</h1>
            <p class="text-gray-500">Tools that run on remote MCP servers</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showAddServerForm = true"
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2 inline-block"></span>
              Add Server
            </button>
          </div>
        </div>
        
        <ToolList
          title="Remote Tools"
          :tools="remoteTools"
          emptyIcon="i-heroicons-server-20-solid"
          emptyMessage="No remote tools available"
          showEmptyButton="true"
          emptyButtonText="Add MCP Server"
          @add="showAddServerForm = true"
          @run="startToolTest"
          @details="viewToolDetails"
        />
      </div>
      
      <!-- Default Dashboard -->
      <div v-else class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Tools Dashboard</h1>
            <p class="text-gray-500">Access all available tools in one place</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="activePage = 'settings'"
              class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span class="i-heroicons-cog-6-tooth-20-solid w-5 h-5 mr-2 inline-block"></span>
              Settings
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
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-900">Local Tools</h2>
            <button
              @click="activePage = 'local-tools'"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View All
              <span class="i-heroicons-arrow-right-20-solid w-4 h-4 ml-1 inline-block"></span>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard 
              v-for="tool in localTools" 
              :key="tool.id" 
              :tool="tool"
              @run="startToolTest"
              @details="viewToolDetails"
            />
          </div>
        </div>
        
        <!-- Remote Tools Section -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-900">Remote Tools</h2>
            <button
              @click="activePage = 'remote-tools'"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View All
              <span class="i-heroicons-arrow-right-20-solid w-4 h-4 ml-1 inline-block"></span>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard 
              v-for="tool in remoteTools.slice(0, 3)" 
              :key="tool.id" 
              :tool="tool"
              @run="startToolTest"
              @details="viewToolDetails"
            />
            <div v-if="remoteTools.length === 0" class="col-span-full text-center py-6 bg-white rounded-lg border border-gray-200">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ToolsSidebar from '~/components/tools/ToolsSidebar.vue';
import ToolCard from '~/components/tools/ToolCard.vue';
import ToolList from '~/components/tools/ToolList.vue';
import ToolDetails from '~/components/tools/ToolDetails.vue';
import ToolTestInterface from '~/components/tools/ToolTestInterface.vue';
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

// Navigation state
const activePage = ref('dashboard');

// Tool management
const localTools = computed(() => toolsStore.localTools);
const remoteTools = computed(() => toolsStore.remoteTools);
const selectedTool = ref(null);
const testingTool = ref(null);
const mcpServers = computed(() => serversStore.mcpServers);

// Server management
const showAddServerForm = ref(false);
const editingServer = ref(null);

const handleNavigation = (page) => {
  activePage.value = page;
  selectedTool.value = null;
  testingTool.value = null;
  showAddServerForm.value = false;
  editingServer.value = null;
};

const viewToolDetails = (tool) => {
  selectedTool.value = tool;
  testingTool.value = null;
};

const startToolTest = (tool) => {
  testingTool.value = tool;
  selectedTool.value = null;
};

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
</script>
