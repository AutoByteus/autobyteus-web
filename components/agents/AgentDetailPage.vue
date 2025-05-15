<template>
  <div class="max-w-7xl mx-auto p-6 relative"> <!-- Added relative for positioning context -->
    <!-- Agent Header Section -->
    <div class="mb-6">
      <div class="flex items-center">
        <div 
          class="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
          :class="agent.isRemote ? 'bg-purple-100' : 'bg-blue-100'"
        >
          <span 
            :class="[
              agent.icon || 'i-heroicons-cpu-chip-20-solid', 
              'w-8 h-8', 
              agent.isRemote ? 'text-purple-600' : 'text-blue-600'
            ]"
          ></span>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ agent.name }}</h1>
          <p class="text-gray-500 mt-1">{{ agent.description }}</p>
        </div>
      </div>
    </div>
    
    <!-- Main Content Container -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <!-- Top Bar with Type Label and Action Buttons -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
          <span 
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :class="getAgentTypeStyle()"
          >
            {{ getAgentTypeLabel() }}
          </span>
          <span v-if="agent.isMarketplace" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Marketplace Origin
          </span>
           <span v-if="isLocalAndPublished" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Published to Marketplace
          </span>
        </div>
        
        <div class="flex space-x-3">
          <button
            v-if="!agent.isRemote && !agent.isPublishedToMarketplace"
            @click="handlePublishToMarketplace"
            :disabled="isPublishing"
            class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <span v-if="isPublishing" class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2 animate-spin"></span>
            <span v-else class="i-heroicons-arrow-up-tray-20-solid w-5 h-5 mr-2"></span>
            {{ isPublishing ? 'Publishing...' : 'Publish to Marketplace' }}
          </button>
           <button
            v-if="!agent.isRemote && agent.isPublishedToMarketplace"
            @click="handlePublishToMarketplace"
            :disabled="isPublishing"
            class="inline-flex items-center px-4 py-2 bg-yellow-500 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            <span v-if="isPublishing" class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2 animate-spin"></span>
            <span v-else class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2"></span>
            {{ isPublishing ? 'Updating...' : 'Update in Marketplace' }}
          </button>
          <button 
            @click="runAgent"
            class="inline-flex items-center px-6 py-3 bg-blue-600 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-blue-700"
            :disabled="agent.isMarketplace && !agent.isInstalled"
            :class="{ 'opacity-50 cursor-not-allowed': agent.isMarketplace && !agent.isInstalled }"
          >
            <span class="i-heroicons-play-20-solid w-5 h-5 mr-2"></span>
            Run Agent
          </button>
        </div>
      </div>
      
      <!-- Agent Information Sections (Content unchanged, truncated for brevity) -->
      <div class="grid grid-cols-1 gap-8">
        <!-- Basic Information Section -->
        <div class="border-b border-gray-200 pb-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-1">Agent Type</h3>
                  <p class="text-gray-900">{{ agent.isRemote ? 'Remote Agent' : 'Local Agent' }}</p>
                </div>
                <div v-if="agent.isRemote">
                  <h3 class="text-sm font-medium text-gray-700 mb-1">Provided by</h3>
                  <p class="text-gray-900">{{ agent.serverName }}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-1">Agent Role</h3>
                  <p class="text-gray-900">{{ agent.role || 'Not specified' }}</p>
                </div>
                <div v-if="agent.createdAt">
                  <h3 class="text-sm font-medium text-gray-700 mb-1">Created</h3>
                  <p class="text-gray-900">{{ formatDate(agent.createdAt) }}</p>
                </div>
                <div v-if="agent.updatedAt">
                  <h3 class="text-sm font-medium text-gray-700 mb-1">Last Updated</h3>
                  <p class="text-gray-900">{{ formatDate(agent.updatedAt) }}</p>
                </div>
              </div>
            </div>
            <div>
              <div v-if="agent.isRemote" class="mb-6">
                <h3 class="text-sm font-medium text-gray-700 mb-1">Connection Status</h3>
                <div class="flex items-center">
                  <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <p class="text-green-700">Connected</p>
                </div>
              </div>
              <div v-if="agent.version">
                <h3 class="text-sm font-medium text-gray-700 mb-1">Version</h3>
                <p class="text-gray-900">{{ agent.version }}</p>
              </div>
              <div v-if="agent.author">
                <h3 class="text-sm font-medium text-gray-700 mb-1">Author</h3>
                <p class="text-gray-900">{{ agent.author }}</p>
              </div>
              <div v-if="agent.isMarketplace && agent.category">
                <h3 class="text-sm font-medium text-gray-700 mb-1">Category</h3>
                <p class="text-gray-900">{{ agent.category }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200 pb-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Tools & Capabilities</h2>
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Tools Required (Libraries)</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="toolUrl in agent.tools || []" :key="toolUrl" class="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full hover:bg-gray-200 transition-colors duration-150">
                <a :href="toolUrl" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline" :title="toolUrl">
                  {{ getToolNameFromUrl(toolUrl) }}
                </a>
              </span>
              <span v-if="!agent.tools || agent.tools.length === 0" class="text-gray-500 italic">
                No specific tool libraries specified
              </span>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Skills & Capabilities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div v-for="skill in agent.skills || []" :key="skill" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-gray-700">{{ skill }}</span>
              </div>
              <div v-if="!agent.skills || agent.skills.length === 0" class="text-gray-500 italic">
                No skills specified
              </div>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200 pb-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">System Prompt</h2>
          <div class="bg-gray-50 p-4 rounded-lg">
            <pre class="text-sm text-gray-700 whitespace-pre-wrap font-sans">{{ agent.systemPrompt || 'No system prompt defined' }}</pre>
          </div>
        </div>
        <div v-if="agent.isRemote && agent.p2pInfo" class="border-b border-gray-200 pb-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Remote Agent Information</h2>
          <div class="mb-6" v-if="agent.p2pInfo.performanceMetrics">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h3>
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
          <div class="mb-6" v-if="agent.p2pInfo.securityLevel">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Security Information</h3>
            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p class="text-sm text-gray-600">Security Level</p>
                <p class="text-gray-900 font-medium">{{ agent.p2pInfo.securityLevel }}</p>
              </div>
              <div v-if="agent.p2pInfo.accessControl && agent.p2pInfo.accessControl.length">
                <p class="text-sm text-gray-600">Access Control</p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span v-for="control in agent.p2pInfo.accessControl" :key="control" class="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded">
                    {{ control }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="agent.p2pInfo.connectionRequirements && agent.p2pInfo.connectionRequirements.length">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Connection Requirements</h3>
            <div class="space-y-2">
              <div v-for="requirement in agent.p2pInfo.connectionRequirements" :key="requirement" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm text-gray-700">{{ requirement }}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Advanced Technical Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Agent ID</h3>
              <p class="text-sm text-gray-900 font-mono">{{ agent.id }}</p>
            </div>
            <div v-if="agent.isRemote && agent.serverId" class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Server ID</h3>
              <p class="text-sm text-gray-900 font-mono">{{ agent.serverId }}</p>
            </div>
            <div v-if="!agent.isRemote" class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Runtime Environment</h3>
              <p class="text-sm text-gray-900">Local System</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Notification Overlay -->
    <div 
      v-if="showNotification" 
      class="fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg text-white"
      :class="{
        'bg-green-500': notificationType === 'success',
        'bg-red-500': notificationType === 'error'
      }"
    >
      {{ notificationMessage }}
      <button @click="showNotification = false" class="ml-4 text-lg font-semibold leading-none">&times;</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue'; 
import { useAgentsStore, type LocalAgent } from '~/stores/agents'; 

const props = defineProps({
  agent: {
    type: Object as () => LocalAgent, 
    required: true
  }
});

const emit = defineEmits(['run']);
const agentsStore = useAgentsStore();
const isPublishing = ref(false); 

// Notification state
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');
let notificationTimeout: ReturnType<typeof setTimeout> | null = null;

const displayNotification = (message: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  notificationTimeout = setTimeout(() => {
    showNotification.value = false;
  }, duration);
};


// Helper function to extract tool name from URL
function getToolNameFromUrl(url: string): string {
  if (!url) return 'Unnamed Tool';
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || 'tool'; 
    return lastPart.replace(/\.git$/, ''); 
  } catch (e) {
    console.warn(`Could not parse tool name from URL: ${url}`, e);
    const simpleName = url.substring(url.lastIndexOf('/') + 1).replace(/\.git$/, '');
    return simpleName || url; 
  }
}

const getAgentTypeStyle = () => {
  if ('marketplaceType' in props.agent && props.agent.marketplaceType) {
    if (props.agent.marketplaceType === 'p2p') {
      return 'bg-purple-100 text-purple-800';
    } else if (props.agent.marketplaceType === 'local') {
      return 'bg-green-100 text-green-800';
    }
  }
  return props.agent.isRemote ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
};

const getAgentTypeLabel = () => {
   if ('marketplaceType' in props.agent && props.agent.marketplaceType) {
    if (props.agent.marketplaceType === 'p2p') {
      return props.agent.installed ? 'P2P Agent - Installed' : 'P2P Agent';
    } else if (props.agent.marketplaceType === 'local') {
      return props.agent.installed ? 'Local Runnable - Installed' : 'Local Runnable';
    }
  }
  return props.agent.isRemote ? 'Remote Agent' : 'Local Agent';
};

const runAgent = () => {
  emit('run', props.agent);
};

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const isLocalAndPublished = computed(() => {
  return !props.agent.isRemote && props.agent.isPublishedToMarketplace === true;
});


const handlePublishToMarketplace = async () => {
  if (props.agent && !props.agent.isRemote && !isPublishing.value) {
    isPublishing.value = true;
    const actionText = props.agent.isPublishedToMarketplace ? 'updated' : 'published';
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
      const publishedAgent = agentsStore.publishLocalAgentToMarketplace(props.agent.id);
      if (publishedAgent) {
        displayNotification(`Agent "${publishedAgent.name}" has been successfully ${actionText} in the marketplace!`, 'success');
      } else {
        displayNotification(`Failed to ${props.agent.isPublishedToMarketplace ? 'update' : 'publish'} agent "${props.agent.name}" in/to the marketplace.`, 'error');
      }
    } catch (error) {
      console.error(`Error ${props.agent.isPublishedToMarketplace ? 'updating' : 'publishing'} agent:`, error);
      displayNotification(`An error occurred while ${props.agent.isPublishedToMarketplace ? 'updating' : 'publishing'} the agent.`, 'error');
    } finally {
      isPublishing.value = false;
    }
  }
};

</script>
