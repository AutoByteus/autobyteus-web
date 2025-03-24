import { EventEmitter } from 'events'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'
import axios from 'axios'

/**
 * ServerStatusManager acts as a bridge between the Electron main process and renderer
 * process, providing server status information and control methods.
 */
export class ServerStatusManager extends EventEmitter {
  private manager: BaseServerManager
  private isInitializing: boolean = false
  private healthCheckStatus: string = ''
  private externalServerDetected: boolean = false
  
  constructor(serverManager: BaseServerManager) {
    super()
    this.manager = serverManager
    
    // Set up event handlers for server status changes
    this.manager.onReady(() => {
      logger.info('ServerStatusManager: Server is ready')
      this.emitStatusChange('running')
    })
    
    this.manager.onError((error) => {
      logger.error('ServerStatusManager: Server error:', error)
      this.emitStatusChange('error', error.message)
    })
  }
  
  /**
   * Initialize the server - checking for existing server first and starting internal server if needed
   */
  async initializeServer(): Promise<void> {
    if (this.isInitializing) {
      logger.info('ServerStatusManager: Server initialization already in progress')
      return
    }
    
    this.isInitializing = true
    
    try {
      logger.info('ServerStatusManager: Checking for existing server')
      
      // First check if a server is already running at the port
      const isExistingServer = await this.manager.checkExistingServer()
      this.externalServerDetected = isExistingServer
      
      if (isExistingServer) {
        // Server is already running, emit status update
        logger.info('ServerStatusManager: Found existing server')
        this.emitStatusChange('running')
      } else {
        // No server found, start the internal server
        logger.info('ServerStatusManager: No existing server found, starting internal server')
        this.emitStatusChange('starting')
        await this.manager.startServer()
      }
    } catch (error) {
      logger.error('ServerStatusManager: Server initialization failed:', error)
      this.emitStatusChange('error', error instanceof Error ? error.message : String(error))
    } finally {
      this.isInitializing = false
    }
  }
  
  /**
   * Restart the server
   */
  async restartServer(): Promise<any> {
    logger.info('ServerStatusManager: Restarting server')
    
    // Reset status
    this.emitStatusChange('starting')
    
    try {
      // First check if a server is already running at the port
      const isExistingServer = await this.manager.checkExistingServer()
      
      if (isExistingServer) {
        logger.info('ServerStatusManager: Found existing server, no need to restart')
        this.externalServerDetected = isExistingServer
        this.emitStatusChange('running')
        return this.getStatus()
      }
      
      // Stop the server if it's already running (managed by us)
      if (this.manager.isRunning() && !this.externalServerDetected) {
        this.manager.stopServer()
      }
      
      // Start the server
      await this.manager.startServer()
      return this.getStatus()
    } catch (error) {
      logger.error('ServerStatusManager: Restart failed:', error)
      this.emitStatusChange('error', error instanceof Error ? error.message : String(error))
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        isExternalServerDetected: this.externalServerDetected
      }
    }
  }
  
  /**
   * Check server health
   */
  async checkServerHealth(): Promise<any> {
    try {
      logger.info('ServerStatusManager: Checking server health')
      
      if (!this.manager.isRunning()) {
        // If we think the server isn't running, check if one appeared
        const isExistingServer = await this.manager.checkExistingServer()
        if (isExistingServer) {
          this.externalServerDetected = true
          this.emitStatusChange('running')
          return {
            status: 'ok',
            data: { status: 'ok' },
            isExternalServerDetected: true
          }
        }
        
        // No running server
        return {
          status: 'starting',
          message: 'Server is not running'
        }
      }
      
      // Server is running, check health endpoint
      const urls = this.manager.getServerUrls()
      const response = await axios.get(urls.health, { timeout: 5000 })
      
      if (response.status === 200) {
        this.healthCheckStatus = 'Healthy'
        // Ensure the status is updated to running
        this.emitStatusChange('running')
        return {
          status: 'ok',
          data: response.data,
          isExternalServerDetected: this.externalServerDetected
        }
      } else {
        this.healthCheckStatus = `Error: Unexpected response status ${response.status}`
        return {
          status: 'error',
          message: this.healthCheckStatus,
          isExternalServerDetected: this.externalServerDetected
        }
      }
    } catch (error) {
      logger.error('ServerStatusManager: Health check failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.healthCheckStatus = `Error: ${errorMessage}`
      
      return {
        status: 'error',
        message: errorMessage,
        isExternalServerDetected: this.externalServerDetected
      }
    }
  }
  
  /**
   * Get the current server status
   */
  getStatus(): any {
    const isRunning = this.manager.isRunning()
    const urls = this.manager.getServerUrls()
    
    return {
      status: isRunning ? 'running' : 'starting',
      urls,
      healthCheckStatus: this.healthCheckStatus,
      isExternalServerDetected: this.externalServerDetected
    }
  }
  
  /**
   * Check if we're using an internal server vs. an externally started one
   */
  isUsingInternalServer(): boolean {
    return !this.externalServerDetected
  }
  
  /**
   * Emit status change event
   */
  private emitStatusChange(status: 'starting' | 'running' | 'error', message?: string): void {
    const urls = this.manager.getServerUrls()
    
    const statusObject = {
      status,
      urls,
      message,
      healthCheckStatus: this.healthCheckStatus,
      isExternalServerDetected: this.externalServerDetected
    }
    
    logger.info(`ServerStatusManager: Emitting status change: ${status}`)
    this.emit('status-change', statusObject)
  }
}
