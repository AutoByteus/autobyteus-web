<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 max-w-7xl mx-auto p-6">
    <!-- Header with name, author and back button -->
    <div class="flex justify-between items-center pb-6 border-b border-gray-100">
      <div>
        <h1 class="text-2xl font-medium text-indigo-600 mb-1">{{ agent.name }}</h1>
        <div class="flex items-center">
          <span class="text-sm text-gray-500">by {{ agent.author }}</span>
          <span class="inline-block mx-2 text-gray-300">•</span>
          <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', executionTypeClass]">
            {{ agent.executionType }}
          </span>
          <template v-if="showStatus">
            <span class="inline-block mx-2 text-gray-300">•</span>
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusClass]">
              {{ agent.status }}
            </span>
          </template>
        </div>
      </div>
      
      <div class="flex space-x-3">
        <!-- Installation Buttons -->
        <button 
          v-if="showLocalInfo && !isInstalled"
          @click="installLocalAgent"
          class="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700"
        >
          <span class="i-heroicons-download-20-solid w-5 h-5 mr-2 inline-block"></span>
          Install Locally
        </button>
        
        <button 
          v-if="showP2PInfo && !isP2PInstalled"
          @click="installP2PAgent"
          class="px-4 py-2 bg-purple-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-purple-700"
        >
          <span class="i-heroicons-server-20-solid w-5 h-5 mr-2 inline-block"></span>
          Configure as P2P
        </button>
        
        <button 
          @click="$emit('back')"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span class="i-heroicons-arrow-left-20-solid w-5 h-5 mr-2 inline-block"></span>
          Back to Marketplace
        </button>
      </div>
    </div>
    
    <div class="py-6">
      <!-- Main content organized by importance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left column - Primary information -->
        <div>
          <!-- Agent Role - Most important -->
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-2">Agent Role</h2>
            <p class="text-gray-900 font-medium text-base">{{ agent.role }}</p>
          </div>
          
          <!-- Description - Core understanding -->
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-2">Overview</h2>
            <p class="text-gray-700">{{ agent.description }}</p>
          </div>

          <!-- Skills & Capabilities - Key functionality -->
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-3">Skills & Capabilities</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div v-for="skill in agent.skills" :key="skill" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-gray-700">{{ skill }}</span>
              </div>
            </div>
          </div>
          
          <!-- Required Tools - Technical requirements -->
          <div v-if="showLocalInfo" class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-3">Required Tools</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tool in agent.tools"
                :key="tool"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {{ tool }}
              </span>
            </div>
          </div>
          
          <!-- System Prompt - Important for understanding behavior -->
          <div v-if="showLocalInfo" class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-3">System Prompt</h2>
            <div class="bg-gray-50 p-4 rounded-lg">
              <pre class="text-sm text-gray-700 whitespace-pre-wrap">{{ agent.systemPrompt || 'No system prompt defined' }}</pre>
            </div>
          </div>
          
          <!-- Pricing information - Important for purchase decision -->
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-2">Pricing</h2>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-2xl font-bold text-gray-900">{{ priceDisplay }}</p>
              <p class="text-sm text-gray-600">{{ priceType }}</p>
            </div>
          </div>
        </div>
        
        <!-- Right column - Secondary information and features -->
        <div>
          <!-- P2P agent specific information - Important for P2P agents -->
          <template v-if="showP2PInfo">
            <div class="space-y-6 mb-8">
              <div>
                <h2 class="text-lg font-medium text-gray-800 mb-3">Performance Metrics</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Average Response Time</p>
                    <p class="text-gray-900 font-medium">{{ agent.p2pInfo.performanceMetrics.avgResponseTime }}</p>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Reliability</p>
                    <p class="text-gray-900 font-medium">{{ agent.p2pInfo.performanceMetrics.reliability }}</p>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Uptime</p>
                    <p class="text-gray-900 font-medium">{{ agent.p2pInfo.performanceMetrics.uptime }}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 class="text-lg font-medium text-gray-800 mb-3">Security Information</h2>
                <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p class="text-sm text-gray-600">Security Level</p>
                    <p class="text-gray-900 font-medium">{{ agent.p2pInfo.securityLevel }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Access Control</p>
                    <div class="flex flex-wrap gap-2 mt-1">
                      <span
                        v-for="control in agent.p2pInfo.accessControl"
                        :key="control"
                        class="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded"
                      >
                        {{ control }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="agent.p2pInfo.connectionRequirements">
                <h2 class="text-lg font-medium text-gray-800 mb-3">Connection Requirements</h2>
                <div class="space-y-2">
                  <div
                    v-for="requirement in agent.p2pInfo.connectionRequirements"
                    :key="requirement"
                    class="flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm text-gray-700">{{ requirement }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- User feedback section -->
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-800 mb-3">User Feedback</h2>
            <!-- Rating display -->
            <div class="flex items-center mb-3">
              <div class="flex text-yellow-400">
                <svg v-for="n in 5" :key="n" class="h-5 w-5" :class="n <= Math.floor(agent.rating) ? 'text-yellow-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span class="ml-2 text-sm font-medium text-gray-900">{{ agent.rating }} ({{ formatDownloads(agent.downloads) }} downloads)</span>
            </div>
          </div>
          
          <!-- Technical details - Secondary importance -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="text-md font-medium text-gray-700 mb-3">Technical Information</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Category:</span>
                <span class="text-gray-900 font-medium">{{ agent.category }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Version:</span>
                <span class="text-gray-900 font-medium">{{ agent.version }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Updated:</span>
                <span class="text-gray-900 font-medium">{{ formatDate(agent.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Local Agent Installation Modal -->
    <LocalAgentInstallModal 
      v-if="showLocalInstallModal"
      :agent="agent"
      @close="showLocalInstallModal = false"
      @installed="handleLocalAgentInstalled"
    />
    
    <!-- P2P Agent Configuration Modal -->
    <P2PAgentConfigModal
      v-if="showP2PConfigModal"
      :agent="agent"
      @close="showP2PConfigModal = false"
      @installed="handleP2PAgentInstalled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MarketplaceAgent } from '~/stores/agents';
import { useAgentsStore } from '~/stores/agents';
import LocalAgentInstallModal from '~/components/agents/installation/LocalAgentInstallModal.vue';
import P2PAgentConfigModal from '~/components/agents/installation/P2PAgentConfigModal.vue';

const props = defineProps({
  agent: {
    type: Object as () => MarketplaceAgent,
    required: true
  }
});

// Add navigation events
const emit = defineEmits(['install', 'navigate-to-details', 'back']);

const agentsStore = useAgentsStore();
const showLocalInstallModal = ref(false);
const showP2PConfigModal = ref(false);

const isInstalled = computed(() => {
  const installed = agentsStore.getAgentById(props.agent.id);
  return installed && 'isRemote' in installed && !installed.isRemote;
});

const isP2PInstalled = computed(() => {
  const installed = agentsStore.getAgentById(`p2p-${props.agent.id}`);
  return installed && 'isRemote' in installed && installed.isRemote;
});

const executionTypeClass = computed(() => {
  switch (props.agent.executionType) {
    case 'LOCAL':
      return 'bg-green-100 text-green-800';
    case 'P2P':
      return 'bg-blue-100 text-blue-800';
    case 'BOTH':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

const priceDisplay = computed(() => {
  if (props.agent.price === 0) {
    return 'Free';
  }
  return `$${props.agent.price}`;
});

const priceType = computed(() => {
  switch (props.agent.priceType) {
    case 'one-time':
      return 'One-time purchase';
    case 'monthly':
      return 'Monthly subscription';
    case 'yearly':
      return 'Yearly subscription';
    case 'usage-based':
      return 'Usage-based pricing';
    default:
      return '';
  }
});

const statusClass = computed(() => {
  return props.agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
});

const showStatus = computed(() => {
  return props.agent.executionType !== 'LOCAL' && props.agent.status;
});

const showLocalInfo = computed(() => {
  return props.agent.executionType === 'LOCAL' || props.agent.executionType === 'BOTH';
});

const showP2PInfo = computed(() => {
  return props.agent.executionType === 'P2P' || (props.agent.executionType === 'BOTH' && props.agent.p2pInfo);
});

function installLocalAgent() {
  showLocalInstallModal.value = true;
}

function installP2PAgent() {
  showP2PConfigModal.value = true;
}

// Modified to navigate to details page after installation
function handleLocalAgentInstalled() {
  agentsStore.installMarketplaceAgent(props.agent);
  emit('install', props.agent);
  
  // Navigate to local agent details page
  emit('navigate-to-details', {
    type: 'local',
    id: props.agent.id
  });
}

// Modified to navigate to details page after installation
function handleP2PAgentInstalled() {
  // P2P agent installation is handled by the modal
  // Navigate to remote agent details page
  emit('navigate-to-details', {
    type: 'remote',
    id: `p2p-${props.agent.id}`
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatDownloads(downloads: number): string {
  if (downloads < 1000) return downloads.toString();
  if (downloads < 10000) return `${(downloads / 1000).toFixed(1)}k`;
  return `${Math.floor(downloads / 1000)}k`;
}
</script>
