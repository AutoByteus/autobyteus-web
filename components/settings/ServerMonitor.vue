<template>
  <div class="server-monitor bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">Server Status</h2>
    
    <!-- Server Status Card -->
    <div 
      class="status-card p-6 rounded-lg mb-6"
      :class="{
        'bg-green-50 border border-green-200': serverStore.status === 'running',
        'bg-yellow-50 border border-yellow-200': serverStore.status === 'starting',
        'bg-red-50 border border-red-200': serverStore.status === 'error'
      }"
    >
      <div class="flex items-center mb-4">
        <div 
          class="w-3 h-3 rounded-full mr-3" 
          :class="{
            'bg-green-500': serverStore.status === 'running',
            'bg-yellow-500': serverStore.status === 'starting',
            'bg-red-500': serverStore.status === 'error'
          }"
        ></div>
        <h3 class="text-lg font-medium">
          <span v-if="serverStore.status === 'running'">Server Running</span>
          <span v-else-if="serverStore.status === 'starting'">Server Starting</span>
          <span v-else-if="serverStore.status === 'error'">Server Error</span>
          <span v-else>Unknown Status</span>
        </h3>
      </div>
      
      <div class="mb-4">
        <p v-if="serverStore.status === 'running'" class="text-green-700">
          The server is running and ready to use.
        </p>
        <p v-else-if="serverStore.status === 'starting'" class="text-yellow-700">
          {{ serverStore.connectionMessage }}
        </p>
        <p v-else-if="serverStore.status === 'error'" class="text-red-700">
          {{ serverStore.userFriendlyError }}
        </p>
      </div>
      
      <div class="flex justify-end space-x-4">
        <button 
          @click="serverStore.checkServerHealth" 
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors duration-150"
        >
          Refresh Status
        </button>
        <button 
          @click="serverStore.restartServer"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition-colors duration-150"
          :disabled="serverStore.status === 'starting'"
        >
          <span v-if="serverStore.usingInternalServer">
            {{ serverStore.status === 'running' ? 'Restart Server' : 'Start Server' }}
          </span>
          <span v-else>
            Retry Connection
          </span>
        </button>
      </div>
    </div>
    
    <!-- Server Technical Details -->
    <div class="technical-details bg-gray-50 p-6 rounded-lg">
      <h3 class="text-lg font-medium text-gray-800 mb-4">Technical Details</h3>
      
      <div class="grid gap-4 md:grid-cols-2 mb-4">
        <div class="detail-item">
          <span class="text-sm text-gray-500">Server Type:</span>
          <p class="font-mono">{{ serverStore.usingInternalServer ? 'Internal Server' : 'External Server' }}</p>
        </div>
        
        <div class="detail-item" v-if="!serverStore.usingInternalServer">
          <span class="text-sm text-gray-500">Server URL:</span>
          <p class="font-mono">{{ serverStore.urls.graphql }}</p>
        </div>
        
        <div class="detail-item">
          <span class="text-sm text-gray-500">Health Check Status:</span>
          <p class="font-mono">{{ serverStore.healthCheckStatus || 'Not checked' }}</p>
        </div>
        
        <div class="detail-item" v-if="serverStore.isElectron && logFilePath">
          <span class="text-sm text-gray-500">Log File:</span>
          <p class="font-mono">{{ logFilePath }}</p>
        </div>
        
        <div class="detail-item" v-if="serverStore.status === 'error'">
          <span class="text-sm text-gray-500">Error Details:</span>
          <p class="font-mono text-red-600">{{ serverStore.errorMessage }}</p>
        </div>
      </div>
      
      <div class="mt-4" v-if="serverStore.isElectron && logFilePath">
        <button 
          @click="openLogFile" 
          class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          View Server Logs
        </button>
        <div v-if="logFileError" class="text-red-600 mt-2 text-sm">
          {{ logFileError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServerStore } from '~/stores/serverStore'

const serverStore = useServerStore()
const logFilePath = ref('')
const logFileError = ref('')

onMounted(async () => {
  console.log('ServerMonitor: Component mounted with status:', serverStore.status)
  
  // Get the log file path if we're in Electron
  if (serverStore.isElectron && window.electronAPI?.getLogFilePath) {
    try {
      logFilePath.value = await window.electronAPI.getLogFilePath()
    } catch (e) {
      console.error('Failed to get log file path:', e)
      logFileError.value = 'Failed to get log file path'
    }
  }
  
  // Check server health when component is mounted
  serverStore.checkServerHealth()
})

const openLogFile = async () => {
  if (!serverStore.isElectron || !window.electronAPI?.openLogFile || !logFilePath.value) {
    logFileError.value = 'Cannot open log file: functionality not available'
    return
  }
  
  try {
    logFileError.value = '' // Clear any previous error
    const result = await window.electronAPI.openLogFile(logFilePath.value)
    
    if (!result.success) {
      logFileError.value = result.error || 'Failed to open log file'
    }
  } catch (e) {
    console.error('Error opening log file:', e)
    logFileError.value = e instanceof Error ? e.message : 'Unknown error opening log file'
  }
}
</script>

<style scoped>
.detail-item {
  @apply mb-2;
}
</style>
