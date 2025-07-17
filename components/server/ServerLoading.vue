<template>
  <div class="server-loading-container" v-if="serverStore.status === 'starting' || serverStore.status === 'error' || serverStore.status === 'restarting'">
    <div class="server-loading-content">
      <div v-if="serverStore.status === 'starting'" class="loading-state">
        <div class="spinner"></div>
        <h2 class="text-xl font-semibold mt-4">Starting AutoByteus...</h2>
        <p class="text-gray-600 mt-2">{{ serverStore.connectionMessage }}</p>
        
        <div v-if="serverStore.connectionAttempts > 0" class="mt-2 text-gray-600">
          Connection attempt {{ serverStore.connectionAttempts }} of {{ serverStore.maxConnectionAttempts }}...
        </div>
        
        <div v-if="serverStore.isInitialStartup" class="mt-2 text-gray-600">
          <p>Initial server startup may take a moment. Please be patient...</p>
        </div>
        
        <div v-if="showDetails" class="technical-details mt-4">
          <p class="text-gray-600 text-sm">
            Backend service initializing...
          </p>
          <p class="text-gray-600 text-sm font-mono mt-1">
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
            v-if="showDetails"
            @click="serverStore.checkServerHealth" 
            class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none md:ml-4"
          >
            Run health check
          </button>
        </div>
      </div>
      
      <div v-else-if="serverStore.status === 'error'" class="error-state">
        <div class="error-icon">❌</div>
        <h2 class="text-xl font-semibold mt-4 text-red-600">
          Application Error
        </h2>
        <p class="text-gray-800 mt-2">{{ serverStore.userFriendlyError }}</p>
        
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
            Restart Server
          </button>
          <button 
            @click="serverStore.checkServerHealth" 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none mt-2"
          >
            Check Server Health
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

      <div v-else-if="serverStore.status === 'restarting'" class="restarting-state">
        <div class="spinner"></div>
        <h2 class="text-xl font-semibold mt-4">Restarting Server...</h2>
        <p class="text-gray-600 mt-2">Please wait, this may take a moment.</p>
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

// Toggle for showing technical details
const showDetails = ref(false)
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// Log file path
const logFilePath = ref('')

watch(() => serverStore.status, (newStatus, oldStatus) => {
  console.log(`ServerLoading: Status changed from ${oldStatus} to ${newStatus}`)
})

let healthInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  console.log('ServerLoading: Component mounted with status:', serverStore.status)
  
  if (serverStore.isElectron && window.electronAPI?.getLogFilePath) {
    try {
      logFilePath.value = await window.electronAPI.getLogFilePath()
    } catch (e) {
      console.error('Failed to get log file path:', e)
    }
  }
  
  setTimeout(() => {
    serverStore.checkServerHealth()
  }, 2000)
  
  healthInterval = setInterval(() => {
    if (serverStore.status === 'starting') {
      console.log('ServerLoading: Still starting, checking health again')
      serverStore.checkServerHealth()
    } else if (healthInterval) {
      clearInterval(healthInterval)
      healthInterval = null
    }
  }, serverStore.isInitialStartup ? 5000 : 3000)
})

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
