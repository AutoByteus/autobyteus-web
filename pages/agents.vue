<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar Menu -->
    <SidebarMenu
      :active-page="activePage"
      @change-page="changePage"
    />

    <!-- Content section -->
    <div class="flex-1 overflow-auto">
      <!-- Agent Chat Interface -->
      <div v-if="showChatInterface && activeChatAgent">
        <AgentChatInterface
          :agent="activeChatAgent"
          @back="closeChatInterface"
        />
      </div>
      
      <!-- Server Management -->
      <div v-else-if="showAddServerForm || editingServer">
        <ServerForm
          :initial-data="editingServer || {}"
          server-type="agent"
          @submit="handleServerFormSubmit"
          @cancel="cancelServerForm"
        />
      </div>
      
      <!-- Agent Detail - Local or Remote -->
      <div v-else-if="activeAgent && isLocalAgent(activeAgent)">
        <AgentDetailPage
          :agent="activeAgent"
          @run="runAgent"
        />
      </div>
      
      <!-- Marketplace Agent Detail -->
      <div v-else-if="activeAgent && isMarketplaceAgent(activeAgent)">
        <MarketplaceAgentDetail
          :agent="activeAgent"
          @install="installMarketplaceAgent"
          @navigate-to-details="handleNavigationAfterInstall"
        />
      </div>

      <!-- Server Management Section -->
      <div v-else-if="showServerManagement">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Remote Agent Management</h1>
            <p class="text-gray-500">
              Connect to remote agents to access P2P capabilities.
            </p>
          </div>
          
          <ServerList 
            :servers="agentServers" 
            server-type="agent" 
            title="Remote Agents"
            @add="showAddServerForm = true"
            @edit="editServer"
            @delete="deleteServer"
          />
        </div>
      </div>
      
      <!-- Local Agents Page -->
      <div v-else-if="activePage === 'local-agents'">
        <div class="max-w-7xl mx-auto p-6">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Local Agents</h1>
              <p class="text-gray-500">Access your installed local AI agents</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LocalAgentCard 
              v-for="agent in agentsStore.getLocalAgents" 
              :key="agent.id" 
              :agent="agent"
              @run="runAgent"
              @view-details="setActiveAgent"
            />
            <div v-if="agentsStore.getLocalAgents.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
              <span class="i-heroicons-face-frown-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
              <p class="text-gray-500">No local agents available</p>
              <p class="text-gray-500 mt-2">Install agents from the marketplace to get started</p>
              <button
                @click="changePage('marketplace')"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <span class="i-heroicons-shopping-bag-20-solid w-4 h-4 mr-1"></span>
                Browse Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Remote Agents Page -->
      <div v-else-if="activePage === 'remote-agents'">
        <div class="max-w-7xl mx-auto p-6">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Remote Agents</h1>
              <p class="text-gray-500">Access P2P and remote AI agents</p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="showServerManagement = true"
                class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="i-heroicons-server-20-solid w-5 h-5 mr-2 inline-block"></span>
                Manage Remote Agents
              </button>
              <button
                @click="showAddServerForm = true"
                class="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
              >
                <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2 inline-block"></span>
                Add Remote Agent
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RemoteAgentCard 
              v-for="agent in agentsStore.getRemoteAgents" 
              :key="agent.id" 
              :agent="agent"
              @run="runAgent"
              @view-details="setActiveAgent"
            />
            <div v-if="agentsStore.getRemoteAgents.length === 0" class="col-span-full text-center py-8 bg-white rounded-lg border border-gray-200">
              <span class="i-heroicons-server-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"></span>
              <p class="text-gray-500 mb-2">No Remote Agents configured</p>
              <button
                @click="showAddServerForm = true"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <span class="i-heroicons-plus-20-solid w-4 h-4 mr-1"></span>
                Add Remote Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Marketplace Page -->
      <div v-else-if="activePage === 'marketplace'">
        <MarketplacePage
          :p2p-agents="filteredP2PAgents"
          :local-agents="filteredLocalAgents"
          :current-filter="currentFilter"
          :is-syncing="isSyncing"
          @select-agent="setActiveAgent"
          @filter-change="handleMarketplaceFilter"
          @sync="syncMarketplace"
        />
      </div>

      <!-- Workflows Page -->
      <div v-else-if="activePage === 'workflows'">
        <WorkflowsPage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SidebarMenu from '~/components/agents/SidebarMenu.vue';
import AgentDetailPage from '~/components/agents/AgentDetailPage.vue';
import MarketplaceAgentDetail from '~/components/agents/MarketplaceAgentDetail.vue';
import AgentChatInterface from '~/components/agents/AgentChatInterface.vue';
import ServerForm from '~/components/servers/ServerForm.vue';
import ServerList from '~/components/servers/ServerList.vue';
import LocalAgentCard from '~/components/agents/LocalAgentCard.vue';
import RemoteAgentCard from '~/components/agents/RemoteAgentCard.vue';
import MarketplacePage from '~/components/agents/pages/MarketplacePage.vue';
import WorkflowsPage from '~/components/agents/pages/WorkflowsPage.vue';
import { useServersStore } from '~/stores/servers';
import { useAgentsStore } from '~/stores/agents';
import type { LocalAgent, MarketplaceAgent } from '~/stores/agents';

definePageMeta({
  title: 'AI Agents',
  description: 'Access local and remote AI agents'
});

// Store references
const serversStore = useServersStore();
const agentsStore = useAgentsStore();

// UI state - default to local-agents
const activePage = ref('local-agents');
const showAddServerForm = ref(false);
const showServerManagement = ref(false);
const isSyncing = ref(false);
const editingServer = ref(null);
const currentFilter = ref('all');
const advancedFilters = ref({
  searchQuery: '',
  category: 'all',
  priceType: 'all'
});
const showChatInterface = ref(false);
const activeChatAgent = ref<LocalAgent | MarketplaceAgent | null>(null);

// Set Local Agents as the default page on mount
onMounted(() => {
  activePage.value = 'local-agents';
});

// Page navigation
const changePage = (page: string) => {
  activePage.value = page;
  clearActiveAgent();
  showServerManagement.value = false;
  showAddServerForm.value = false;
};

// Filter handlers
const handleMarketplaceFilter = (filter: string) => {
  currentFilter.value = filter;
};

// Marketplace computed properties
const p2pAgents = computed(() => {
  return agentsStore.marketplaceAgents.filter(agent => 
    agent.executionType === 'P2P' || agent.executionType === 'BOTH');
});

const locallyRunnableAgents = computed(() => {
  return agentsStore.marketplaceAgents.filter(agent => 
    agent.executionType === 'LOCAL' || agent.executionType === 'BOTH');
});

// Filtered agents based on current filter
const filteredP2PAgents = computed(() => 
  currentFilter.value === 'local' ? [] : p2pAgents.value
);

const filteredLocalAgents = computed(() => 
  currentFilter.value === 'p2p' ? [] : locallyRunnableAgents.value
);

// Marketplace actions
const syncMarketplace = async () => {
  isSyncing.value = true;
  try {
    // Simulate API call to sync marketplace
    await new Promise(resolve => setTimeout(resolve, 1500));
    agentsStore.syncMarketplace();
  } finally {
    isSyncing.value = false;
  }
};

const installMarketplaceAgent = (agent: MarketplaceAgent) => {
  agentsStore.installMarketplaceAgent(agent);
  setActiveAgent(agentsStore.getAgentById(agent.id)!);
};

// Handle navigation after installation
const handleNavigationAfterInstall = (navigationInfo) => {
  if (navigationInfo.type === 'local') {
    changePage('local-agents');
    setTimeout(() => {
      setActiveAgent(agentsStore.getAgentById(navigationInfo.id)!);
    }, 100);
  } else if (navigationInfo.type === 'remote') {
    changePage('remote-agents');
    setTimeout(() => {
      setActiveAgent(agentsStore.getAgentById(navigationInfo.id)!);
    }, 100);
  }
};

// Server management
const agentServers = computed(() => serversStore.agentServers);
const handleServerFormSubmit = (server) => {
  if (editingServer.value) {
    serversStore.updateServer(server);
  } else {
    serversStore.addServer(server);
  }
  showAddServerForm.value = false;
  editingServer.value = null;
  changePage('remote-agents');
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
  changePage('remote-agents');
};

// Agent management
const activeAgent = ref<LocalAgent | MarketplaceAgent | null>(null);
const setActiveAgent = (agent: LocalAgent | MarketplaceAgent | string) => {
  if (typeof agent === 'string') {
    // If it's just the ID, find the full agent object
    activeAgent.value = agentsStore.getAgentById(agent) as LocalAgent | MarketplaceAgent | null;
  } else {
    activeAgent.value = agent;
  }
};

const runAgent = (agent: LocalAgent | MarketplaceAgent) => {
  activeChatAgent.value = agent;
  showChatInterface.value = true;
  activeAgent.value = null;
};

const closeChatInterface = () => {
  showChatInterface.value = false;
  activeChatAgent.value = null;
};

const clearActiveAgent = () => {
  activeAgent.value = null;
};

// Type guards
const isLocalAgent = (agent: any): agent is LocalAgent => {
  return 'isRemote' in agent;
};

const isMarketplaceAgent = (agent: any): agent is MarketplaceAgent => {
  return 'executionType' in agent;
};
</script>
