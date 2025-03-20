<template>
  <div 
    class="server-loading-container" 
    v-if="showComponent && !serverStore.allowAppWithoutServer"
  >
    <div class="server-loading-content">
      <div v-if="serverStore.status === 'starting'" class="loading-state">
        <div class="spinner"></div>
        <h2 class="text-xl font-semibold mt-4">Starting AutoByteus...</h2>
        <p class="text-gray-600 mt-2">{{ serverStore.connectionMessage }}</p>
        
        <div v-if="serverStore.connectionAttempts > 0 && !serverStore.usingInternalServer" class="mt-2 text-gray-600">
          Connection attempt {{ serverStore.connectionAttempts }} of {{ serverStore.maxConnectionAttempts }}...
        </div>
        
        <div v-if="serverStore.usingInternalServer && serverStore.isInitialStartup" class="mt-2 text-gray-600">
          <p>Initial server startup may take a moment. Please be patient...</p>
        </div>
        
        <div v-if="showDetails" class="technical-details mt-4">
          <p class="text-gray-600 text-sm">
            <span v-if="serverStore.usingInternalServer">Backend service initializing...</span>
            <span v-else>Connecting to external server at:</span>
          </p>
          <p v-if="!serverStore.usingInternalServer" class="text-gray-600 text-sm font-mono mt-1">
            {{ serverStore.urls.graphql }}
          </p>
          <p v-if="serverStore.healthCheckStatus" class="text-gray-600 text-sm mt-2">
            Health check: {{ serverStore.healthCheckStatus }}
          </p>
          <p v-if="logFilePath" class="text-gray-600 text-sm mt-2">
            Logs available at: {{ logFilePath }}
          </p>
        </div>
        
        <div class="mt-4 flex flex-col md:flex-row gap-2 justify-center">
          <button 
            @click="toggleDetails" 
            class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {{ showDetails ? 'Hide technical details' : 'Show technical details' }}
          </button>
          
          <button 
            @click="serverStore.checkServerHealth" 
            class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none md:ml-4"
            v-if="showDetails"
          >
            Run health check
          </button>
          
          <!-- New button to continue without server -->
          <button
            @click="continueWithoutServer"
            class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none md:ml-4"
          >
            Continue without server
          </button>
        </div>
      </div>
      
      <div v-else-if="serverStore.status === 'error'" class="error-state">
        <div class="error-icon">❌</div>
        <h2 class="text-xl font-semibold mt-4 text-red-600">
          <span v-if="serverStore.usingInternalServer">Application Error</span>
          <span v-else>Connection Error</span>
        </h2>
        <p class="text-gray-800 mt-2">{{ serverStore.userFriendlyError }}</p>
        
        <div v-if="!serverStore.usingInternalServer" class="mt-2 text-gray-600">
          <p>Please ensure that the server is running and reachable at:</p>
          <p class="font-mono text-sm mt-1">{{ serverStore.urls.graphql }}</p>
        </div>
        
        <div v-if="showDetails && serverStore.errorMessage" class="technical-details mt-4">
          <p class="text-gray-600 text-sm">Technical details: {{ serverStore.errorMessage }}</p>
          <p v-if="serverStore.healthCheckStatus" class="text-gray-600 text-sm mt-2">
            Health check: {{ serverStore.healthCheckStatus }}
          </p>
          <p v-if="logFilePath" class="text-gray-600 text-sm mt-2">
            Logs available at: {{ logFilePath }}
          </p>
        </div>
        
        <div class="mt-4 flex flex-col gap-2">
          <button 
            @click="serverStore.restartServer"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
          >
            <span v-if="serverStore.usingInternalServer">Restart Server</span>
            <span v-else>Retry Connection</span>
          </button>
          
          <button 
            @click="serverStore.checkServerHealth" 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none mt-2"
          >
            Check Server Health
          </button>
          
          <button
            @click="continueWithoutServer"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none mt-2"
          >
            Continue without server
          </button>
          
          <button 
            v-if="serverStore.errorMessage"
            @click="toggleDetails" 
            class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none mt-2"
          >
            {{ showDetails ? 'Hide technical details' : 'Show technical details' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useServerStore } from '~/stores/serverStore'
import { useRouter } from 'vue-router'

// Use the server store
const serverStore = useServerStore()
const router = useRouter()

// Show component only when server is not running or has an error
// Also respect the allowAppWithoutServer flag
const showComponent = computed(() => 
  (serverStore.status !== 'running' && !serverStore.allowAppWithoutServer)
)

// Toggle for showing technical details
const showDetails = ref(false)
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// Function to continue without server
const continueWithoutServer = () => {
  serverStore.setAllowAppWithoutServer(true)
  // Optionally, we could navigate to the settings page to show server status
  router.push('/settings?section=server-status')
}

// Log file path
const logFilePath = ref('')

// For debugging - log status changes
watch(() => serverStore.status, (newStatus, oldStatus) => {
  console.log(`ServerLoading: Status changed from ${oldStatus} to ${newStatus}`)
})

// Interval reference for health checks
let healthInterval: NodeJS.Timeout | null = null

// Check health automatically when component mounts
onMounted(async () => {
  console.log('ServerLoading: Component mounted with status:', serverStore.status)
  console.log('ServerLoading: Using internal server:', serverStore.usingInternalServer)
  
  // Get the log file path if we're in Electron
  if (serverStore.isElectron && window.electronAPI?.getLogFilePath) {
    try {
      logFilePath.value = await window.electronAPI.getLogFilePath()
    } catch (e) {
      console.error('Failed to get log file path:', e)
    }
  }
  
  // Run a health check after mounting
  setTimeout(() => {
    serverStore.checkServerHealth()
  }, 2000) // Check after 2 seconds to give server time to start
  
  // Set up an interval to check again if still in 'starting' state
  // Use a variable interval based on whether we're in initial startup
  healthInterval = setInterval(() => {
    if (serverStore.status === 'starting') {
      console.log('ServerLoading: Still in starting state, checking health again')
      serverStore.checkServerHealth()
    } else if (healthInterval) {
      clearInterval(healthInterval)
      healthInterval = null
    }
  }, serverStore.isInitialStartup ? 5000 : 3000) // Check less frequently during initial startup
})

// Clean up interval when component is unmounted
onBeforeUnmount(() => {
  if (healthInterval) {
    clearInterval(healthInterval)
    healthInterval = null
  }
})
</script>

<style scoped>
.server-loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.server-loading-content {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 30rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.error-icon {
  font-size: 50px;
  margin: 0 auto;
}

.technical-details {
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-family: monospace;
  text-align: left;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
