import { defineStore } from 'pinia'
import axios from 'axios'
import { INTERNAL_SERVER_PORT, getServerUrls, isElectronEnvironment } from '~/utils/serverConfig'

// Define the state interface
interface ServerState {
  status: 'starting' | 'running' | 'error'
  port: number
  urls: {
    graphql: string
    rest: string
    ws: string
    transcription: string
    health: string
  }
  errorMessage: string
  isElectron: boolean
  healthCheckStatus: string
  usingInternalServer: boolean
  connectionAttempts: number
  maxConnectionAttempts: number
  isInitialStartup: boolean
  logFilePath: string
  allowAppWithoutServer: boolean
}

export const useServerStore = defineStore('server', {
  state: (): ServerState => ({
    status: 'starting',
    port: INTERNAL_SERVER_PORT,
    urls: getServerUrls(),
    errorMessage: '',
    isElectron: isElectronEnvironment(),
    healthCheckStatus: '',
    usingInternalServer: true, // Default to true in Electron, will be updated based on actual connection
    connectionAttempts: 0,
    maxConnectionAttempts: 5,
    isInitialStartup: true,
    logFilePath: '',
    allowAppWithoutServer: false
  }),
  
  getters: {
    // Add a new getter to determine if restart is possible
    canRestartServer: (state) => {
      // Can only restart if we're in Electron AND using an internal server
      return state.isElectron && state.usingInternalServer;
    },
    
    userFriendlyError: (state): string => {
      // During initial startup with internal server, don't show technical error messages
      if (state.isInitialStartup && state.usingInternalServer) {
        return 'The server is starting up. This may take a moment...'
      }
      
      if (!state.errorMessage) {
        if (state.usingInternalServer) {
          return 'Failed to start the application server.'
        } else {
          return 'Failed to connect to the external server.'
        }
      }
      
      // Transform technical error messages to user-friendly ones
      if (state.errorMessage.includes('ECONNREFUSED') || state.errorMessage.includes('connect')) {
        if (state.usingInternalServer) {
          if (state.isInitialStartup) {
            return 'The server is starting up. This may take a moment...'
          } else {
            return 'Could not connect to the application services. Please try again or contact support.'
          }
        } else {
          return 'Could not connect to the external server. Please check that the server is running and your network connection is working.'
        }
      }
      
      if (state.errorMessage.includes('server')) {
        if (state.usingInternalServer) {
          return 'The application server could not start properly. Please try again or contact support.'
        } else {
          return 'Could not connect to the external server. Please verify the server is running and try again.'
        }
      }
      
      if (state.errorMessage.includes('timeout')) {
        if (state.usingInternalServer) {
          if (state.isInitialStartup) {
            return 'The server is taking longer than expected to start. Please wait a moment...'
          } else {
            return 'Connection to the application server timed out. Please try again or contact support.'
          }
        } else {
          return 'Connection to the external server timed out. Please check your network connection and server status.'
        }
      }
      
      return state.errorMessage
    },
    
    connectionMessage: (state): string => {
      if (state.status === 'starting') {
        if (state.usingInternalServer) {
          if (state.isInitialStartup) {
            return 'Please wait while the application server starts...'
          } else {
            return 'Connecting to application server...'
          }
        } else {
          return 'Connecting to external server...'
        }
      } else if (state.status === 'error') {
        // Use the user-friendly error message
        return state.errorMessage || 'Error connecting to server'
      } else {
        return 'Connected to server'
      }
    }
  },
  
  actions: {
    /**
     * Set the allowAppWithoutServer flag
     */
    setAllowAppWithoutServer(value: boolean): void {
      this.allowAppWithoutServer = value
    },
    
    /**
     * Initialize the server configuration
     */
    async initialize(): Promise<void> {
      console.log('serverStore: Initializing server config')
      
      // Always explicitly set status to starting at initialization
      this.status = 'starting'
      this.errorMessage = ''
      this.connectionAttempts = 0
      this.isInitialStartup = true
      
      // Set the URLs based on the environment
      this.urls = getServerUrls()
      this.isElectron = isElectronEnvironment()
      
      // If we're in browser mode, always set usingInternalServer to false
      if (!this.isElectron) {
        this.usingInternalServer = false
        console.log('serverStore: Browser mode detected, using external server')
      }
      
      console.log(`serverStore: Running in ${this.isElectron ? 'Electron' : 'browser'} mode`)
      
      // Try to get the log file path in Electron environment
      if (this.isElectron && window.electronAPI?.getLogFilePath) {
        try {
          this.logFilePath = await window.electronAPI.getLogFilePath()
          console.log('serverStore: Log file path:', this.logFilePath)
        } catch (e) {
          console.error('serverStore: Failed to get log file path:', e)
        }
      }
      
      // Check for an existing server first, regardless of environment
      try {
        const isServerRunning = await this.checkServerHealth()
        if (isServerRunning.status === 'ok') {
          console.log('serverStore: Found existing server on startup')
          this.status = 'running'
          this.errorMessage = ''
          this.isInitialStartup = false
          
          // If we're in browser mode, any server we connect to is external
          if (!this.isElectron) {
            this.usingInternalServer = false
            console.log('serverStore: Connected to external server in browser mode')
          }
          
          return
        }
      } catch (e) {
        console.log('serverStore: No existing server found on initial check')
        // Continue with normal flow if no server found
      }
      
      // If we're in Electron, handle server initialization through Electron
      if (this.isElectron) {
        this.handleElectronServerInitialization()
      } else {
        // In browser mode, try to connect to configured server
        this.handleBrowserServerConnection()
      }
      
      // After a reasonable time, mark the initial startup phase as complete
      setTimeout(() => {
        this.isInitialStartup = false
      }, 30000) // 30 seconds should be enough for most server startups
    },
    
    /**
     * Initialize through Electron's server manager
     */
    handleElectronServerInitialization(): void {
      let removeServerStatusListener: (() => void) | null = null
      
      // Initialize with server status
      if (window.electronAPI?.getServerStatus) {
        window.electronAPI.getServerStatus()
          .then((serverStatus) => {
            console.log('serverStore: Received server status:', serverStatus)
            this.updateServerStatus(serverStatus)
            
            // Update usingInternalServer based on the status
            if (serverStatus.isExternalServerDetected === true) {
              console.log('serverStore: Connected to externally started server')
              this.usingInternalServer = false
            } else {
              console.log('serverStore: Using internal server')
              this.usingInternalServer = true
            }
          })
          .catch((error) => {
            console.error('serverStore: Failed to get application status:', error)
            // During initial startup, don't show errors from status requests
            if (!this.isInitialStartup) {
              this.status = 'error'
              this.errorMessage = 'Failed to connect to the application services'
            }
          })
      } else {
        console.warn('serverStore: electronAPI.getServerStatus not available')
      }
      
      // Listen for status updates
      if (window.electronAPI?.onServerStatus) {
        console.log('serverStore: Setting up server status listener')
        removeServerStatusListener = window.electronAPI.onServerStatus((serverStatus) => {
          console.log('serverStore: Server status update received:', serverStatus)
          
          // When we receive 'running' status, mark initial startup as complete
          if (serverStatus.status === 'running') {
            this.isInitialStartup = false
          }
          
          // Update usingInternalServer based on the status
          if (serverStatus.isExternalServerDetected === true) {
            this.usingInternalServer = false
          } else if (serverStatus.isExternalServerDetected === false) {
            this.usingInternalServer = true
          }
          
          this.updateServerStatus(serverStatus)
        })
      } else {
        console.warn('serverStore: electronAPI.onServerStatus not available')
      }
      
      // Set up a periodic health check to detect when server is ready
      const healthCheckInterval = setInterval(() => {
        if (this.status === 'running') {
          clearInterval(healthCheckInterval)
          return
        }
        
        this.checkServerHealth().then(result => {
          if (result.status === 'ok') {
            // Server is ready, clear initial startup flag
            this.isInitialStartup = false
          }
        }).catch(() => {
          // Ignore errors during health checks in initial startup
        })
      }, 2000) // Check every 2 seconds
    },
    
    /**
     * Handle server connection in browser environment
     */
    handleBrowserServerConnection(): void {
      // Reset connection attempts
      this.connectionAttempts = 0
      this.status = 'starting'
      this.usingInternalServer = false // In browser mode, we're always connecting to an external server
      console.log('serverStore: Setting connection mode to external server in browser mode')
      
      // Show a slight delay before first connection attempt to ensure loading screen appears
      setTimeout(() => {
        this.attemptServerConnection()
      }, 1000)
    },
    
    /**
     * Attempt to connect to server with retries
     */
    async attemptServerConnection(): Promise<void> {
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        this.status = 'error'
        this.errorMessage = `Failed to connect to server after ${this.maxConnectionAttempts} attempts`
        this.isInitialStartup = false
        return
      }
      
      this.connectionAttempts++
      console.log(`serverStore: Connection attempt ${this.connectionAttempts} of ${this.maxConnectionAttempts}`)
      
      try {
        const result = await this.checkServerHealth()
        if (result.status === 'ok') {
          this.status = 'running'
          this.errorMessage = ''
          this.isInitialStartup = false
        } else {
          // If not healthy and we haven't reached max attempts, try again
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            setTimeout(() => {
              this.attemptServerConnection()
            }, 2000) // Wait 2 seconds between attempts
          } else {
            this.status = 'error'
            this.errorMessage = 'Could not connect to the server after multiple attempts'
            this.isInitialStartup = false
          }
        }
      } catch (error) {
        console.log('serverStore: Connection attempt failed:', 
          error instanceof Error ? `${error.name}: ${error.message}` : String(error))
        
        // If we haven't reached max attempts, try again
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          setTimeout(() => {
            this.attemptServerConnection()
          }, 2000) // Wait 2 seconds between attempts
        } else {
          this.status = 'error'
          this.errorMessage = error instanceof Error ? error.message : 'Unknown error connecting to server'
          this.isInitialStartup = false
        }
      }
    },
    
    /**
     * Update the server status (for Electron mode)
     */
    updateServerStatus(serverStatus: any): void {
      if (!serverStatus) {
        console.warn('serverStore: Received empty server status')
        return
      }
      
      console.log('serverStore: Updating server status with:', serverStatus)
      
      if (serverStatus.status) {
        // When we transition to 'running', mark initial startup as complete
        if (serverStatus.status === 'running' && this.status !== 'running') {
          this.isInitialStartup = false
        }
        
        this.status = serverStatus.status
      }
      
      if (serverStatus.status === 'error' && serverStatus.message) {
        this.errorMessage = serverStatus.message
        this.isInitialStartup = false // An explicit error message means we're past initial startup
      }
      
      // Explicitly update usingInternalServer based on isExternalServerDetected
      if (serverStatus.isExternalServerDetected === true) {
        this.usingInternalServer = false
        console.log('serverStore: External server detected, setting usingInternalServer to false')
      } else if (serverStatus.isExternalServerDetected === false) {
        this.usingInternalServer = true
        console.log('serverStore: Internal server detected, setting usingInternalServer to true')
      }
    },
    
    /**
     * Restart the application services or retry server connection
     */
    async restartServer(): Promise<void> {
      // Only allow restart if we're using an internal server in Electron
      if (!this.canRestartServer) {
        console.warn('serverStore: Cannot restart external server')
        // If we're just trying to reconnect to an external server, try that instead
        if (!this.usingInternalServer) {
          this.status = 'starting'
          this.errorMessage = ''
          this.handleBrowserServerConnection()
        }
        return
      }
      
      // Reset startup flag when manually restarting
      this.isInitialStartup = true
      
      if (!window.electronAPI?.restartServer) {
        console.warn('serverStore: electronAPI.restartServer not available')
        return
      }
      
      this.status = 'starting'
      this.errorMessage = ''
      
      try {
        const result = await window.electronAPI.restartServer()
        this.updateServerStatus(result)
        
        // After a reasonable time, mark the initial startup phase as complete again
        setTimeout(() => {
          this.isInitialStartup = false
        }, 30000)
      } catch (error) {
        console.error('serverStore: Failed to restart application services:', error)
        this.status = 'error'
        this.errorMessage = 'Failed to restart the application'
        this.isInitialStartup = false
      }
    },
    
    /**
     * Check server health
     */
    async checkServerHealth(): Promise<{ status: string; message?: string; data?: any }> {
      if (this.isElectron && window.electronAPI?.checkServerHealth) {
        // For Electron, use the Electron IPC
        this.healthCheckStatus = 'Checking...'
        
        try {
          const result = await window.electronAPI.checkServerHealth()
          
          // Handle the 'starting' status from the main process
          if (result.status === 'starting') {
            this.healthCheckStatus = 'Server is starting up...'
            return result
          }
          
          if (result.status === 'ok') {
            this.healthCheckStatus = `Healthy: ${result.data?.status || 'OK'}`
            
            // If health check says the server is running but our status doesn't reflect that,
            // refresh the server status
            if (this.status !== 'running') {
              try {
                const serverStatus = await window.electronAPI.getServerStatus()
                this.updateServerStatus(serverStatus)
              } catch (e) {
                console.error('serverStore: Error refreshing server status:', e)
              }
            }
            
            // Always update usingInternalServer based on isExternalServerDetected in the result
            if (result.isExternalServerDetected === true) {
              this.usingInternalServer = false
              console.log('serverStore: Health check confirmed external server, setting usingInternalServer to false')
            }
          } else {
            this.healthCheckStatus = `Error: ${result.message || 'Unknown error'}`
          }
          
          return result
        } catch (error) {
          // During initial startup, use a more friendly error message
          if (this.isInitialStartup) {
            this.healthCheckStatus = 'Server is still starting up...'
            return {
              status: 'starting',
              message: 'Server is still starting up'
            }
          }
          
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          this.healthCheckStatus = `Error: ${errorMsg}`
          
          return {
            status: 'error',
            message: errorMsg
          }
        }
      } else {
        // For browser mode or if Electron API is not available, check health directly
        const healthUrl = this.urls.health
        this.healthCheckStatus = `Checking (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`
        
        try {
          console.log(`serverStore: Checking server health at ${healthUrl}`)
          const response = await axios.get(healthUrl, { timeout: 5000 })
          
          if (response.status === 200) {
            this.healthCheckStatus = 'Healthy'
            return { status: 'ok', data: response.data }
          } else {
            this.healthCheckStatus = `Error: Unexpected response status ${response.status}`
            return { status: 'error', message: `Unexpected response status ${response.status}` }
          }
        } catch (error) {
          // During initial startup, don't store technical error messages
          if (!this.isInitialStartup) {
            if (error instanceof Error) {
              this.errorMessage = error.message
            }
          }
          
          // Create a more user-friendly health check status message
          const errorCode = error.code || 'ERROR'
          if (errorCode === 'ECONNREFUSED') {
            this.healthCheckStatus = 'Error: Could not connect to server'
          } else if (errorCode === 'ETIMEDOUT') {
            this.healthCheckStatus = 'Error: Connection timed out'
          } else {
            this.healthCheckStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
          
          return { status: 'error', message: this.healthCheckStatus }
        }
      }
    }
  }
})
