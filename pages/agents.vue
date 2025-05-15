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
      
      <!-- Server Management Form -->
      <div v-else-if="showAddServerForm || editingServer">
        <ServerForm
          :initial-data="editingServer || {}"
          server-type="agent"
          @submit="handleServerFormSubmit"
          @cancel="cancelServerForm"
        />
      </div>

      <!-- Agent Creation Form -->
      <AgentForm
        v-if="showAgentCreationForm"
        form-title="Create New Local Agent"
        @submit="handleAgentFormSubmit"
        @cancel="cancelAgentForm"
      />
      
      <!-- Agent Detail - Local or Remote -->
      <div v-else-if="activeAgent && isLocalAgent(activeAgent) && !showAgentCreationForm && !showServerManagement">
        <AgentDetailPage
          :agent="activeAgent"
          @run="runAgent"
        />
      </div>
      
      <!-- Marketplace Agent Detail -->
      <div v-else-if="activeAgent && isMarketplaceAgent(activeAgent) && !showAgentCreationForm && !showServerManagement">
        <MarketplaceAgentDetail
          :agent="activeAgent"
          @install="installMarketplaceAgent"
          @navigate-to-details="handleNavigationAfterInstall"
          @back="clearActiveAgent" 
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
            <button
              @click="openAgentCreationForm"
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              <span class="i-heroicons-plus-circle-20-solid w-5 h-5 mr-2 inline-block"></span>
              Create New Agent
            </button>
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
              <p class="text-gray-500 mt-2">Install agents from the marketplace or create a new one.</p>
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
import AgentForm from '~/components/agents/AgentForm.vue'; // Import AgentForm
import { useServersStore } from '~/stores/servers';
import { useAgentsStore, type NewLocalAgentData } from '~/stores/agents'; // Import NewLocalAgentData
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
const showAgentCreationForm = ref(false); // State for agent creation form

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
  showAgentCreationForm.value = false; // Close agent creation form on page change
};

// Agent Creation Form handlers
const openAgentCreationForm = () => {
  clearActiveAgent(); // Ensure no agent detail page is shown
  showAgentCreationForm.value = true;
};

const handleAgentFormSubmit = (agentData: NewLocalAgentData) => {
  try {
    agentsStore.createLocalAgent(agentData);
    console.log('Agent created successfully:', agentData.name);
    showAgentCreationForm.value = false;
    // Optionally, navigate to the local agents page or refresh the view
    if (activePage.value !== 'local-agents') {
      changePage('local-agents');
    }
  } catch (error) {
    console.error('Failed to create agent:', error);
    // Handle error display to user if necessary
  }
};

const cancelAgentForm = () => {
  showAgentCreationForm.value = false;
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
const handleNavigationAfterInstall = (navigationInfo: {type: 'local' | 'remote', id: string}) => {
  clearActiveAgent(); // Clear current active agent before navigating
  if (navigationInfo.type === 'local') {
    changePage('local-agents');
    // Use nextTick or setTimeout to ensure the page has changed before setting active agent
    setTimeout(() => {
      const agent = agentsStore.getAgentById(navigationInfo.id);
      if (agent) setActiveAgent(agent);
    }, 0);
  } else if (navigationInfo.type === 'remote') {
    changePage('remote-agents');
    setTimeout(() => {
      const agent = agentsStore.getAgentById(navigationInfo.id);
      if (agent) setActiveAgent(agent);
    }, 0);
  }
};

// Server management
const agentServers = computed(() => serversStore.agentServers);
const handleServerFormSubmit = (serverData: any) => {
  if (editingServer.value) {
    serversStore.updateServer(serverData);
  } else {
    serversStore.addServer(serverData);
  }
  showAddServerForm.value = false;
  editingServer.value = null;
  // Ensure that after server form submission, the view is appropriate e.g. remote agents list
  if (activePage.value !== 'remote-agents') {
     changePage('remote-agents');
  }
  showServerManagement.value = false; // Go back to the list view or relevant page
};

const editServer = (server: any) => {
  editingServer.value = { ...server };
  showAddServerForm.value = true;
  showServerManagement.value = false; // Hide server list to show form
  clearActiveAgent(); // Clear active agent to prevent detail view conflict
};

const deleteServer = (serverId: string) => {
  // Remove agents associated with this server
  agentsStore.deleteAgentsByServerId(serverId);
  
  // Remove the server itself
  serversStore.deleteServer(serverId);
};

const cancelServerForm = () => {
  showAddServerForm.value = false;
  editingServer.value = null;
   // Decide where to navigate after cancel, e.g., back to server management or remote agents list
  if (showServerManagement.value) {
      //  showServerManagement.value = true; // Already true or stay on it
  } else {
      changePage('remote-agents'); // Or whatever is appropriate
  }
};

// Agent management
const activeAgent = ref<LocalAgent | MarketplaceAgent | null>(null);
const setActiveAgent = (agentOrId: LocalAgent | MarketplaceAgent | string) => {
  showAgentCreationForm.value = false; // Ensure creation form is hidden
  showServerManagement.value = false; // Ensure server management is hidden
  showAddServerForm.value = false; // Ensure server form is hidden
  
  if (typeof agentOrId === 'string') {
    activeAgent.value = agentsStore.getAgentById(agentOrId) as LocalAgent | MarketplaceAgent | null;
  } else {
    activeAgent.value = agentOrId;
  }
  console.log('Active agent set:', activeAgent.value?.name);
};

const runAgent = (agent: LocalAgent | MarketplaceAgent) => {
  activeChatAgent.value = agent;
  showChatInterface.value = true;
  activeAgent.value = null; // Clear detail view
  showAgentCreationForm.value = false; // Ensure creation form is hidden
};

const closeChatInterface = () => {
  showChatInterface.value = false;
  activeChatAgent.value = null;
  // Decide where to go back, e.g., to the previous page or a default agent list
  if (activePage.value !== 'local-agents' && activePage.value !== 'remote-agents') {
    changePage('local-agents'); // Default back to local agents list
  }
};

const clearActiveAgent = () => {
  activeAgent.value = null;
  // Ensure we are not on a sub-view that requires an activeAgent
  if (activePage.value !== 'local-agents' && 
      activePage.value !== 'remote-agents' && 
      activePage.value !== 'marketplace' && 
      activePage.value !== 'workflows') {
    // If clearing active agent from a detail page, navigate to a list page
    // This logic might need refinement based on where clearActiveAgent is called
    // For now, if called from marketplace detail, it should go back to marketplace list.
    // The @back emit from MarketplaceAgentDetail.vue handles this for marketplace.
  }
};

// Type guards
const isLocalAgent = (agent: any): agent is LocalAgent => {
  return agent && 'isRemote' in agent;
};

const isMarketplaceAgent = (agent: any): agent is MarketplaceAgent => {
  return agent && 'executionType' in agent;
};
</script>
