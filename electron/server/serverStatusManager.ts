import { EventEmitter } from 'events'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'
import axios from 'axios'
import { ServerStatus } from './serverStatusEnum'

/**
 * ServerStatusManager acts as a bridge between the Electron main process and renderer
 * process, providing server status information and control methods.
 */
export class ServerStatusManager extends EventEmitter {
  private manager: BaseServerManager
  private isInitializing: boolean = false
  private healthCheckStatus: string = ''
  
  constructor(serverManager: BaseServerManager) {
    super()
    this.manager = serverManager
    
    // Set up event handlers for server status changes
    this.manager.onReady(() => {
      logger.info('ServerStatusManager: Server is ready')
      this.emitStatusChange(ServerStatus.RUNNING)
    })
    
    this.manager.onError((error) => {
      logger.error('ServerStatusManager: Server error:', error)
      this.emitStatusChange(ServerStatus.ERROR, error.message)
    })
  }
  
  /**
   * Initialize the internal server.
   */
  async initializeServer(): Promise<void> {
    if (this.isInitializing) {
      logger.info('ServerStatusManager: Server initialization already in progress')
      return
    }
    
    this.isInitializing = true
    
    try {
      logger.info('ServerStatusManager: Starting internal server')
      this.emitStatusChange(ServerStatus.STARTING)
      await this.manager.startServer()
      this.emitStatusChange(ServerStatus.RUNNING)
    } catch (error) {
      logger.error('ServerStatusManager: Server initialization failed:', error)
      this.emitStatusChange(ServerStatus.ERROR, error instanceof Error ? error.message : String(error))
    } finally {
      this.isInitializing = false
    }
  }
  
  /**
   * Restart the internal server with a stable restart flow.
   */
  async restartServer(): Promise<any> {
    logger.info('ServerStatusManager: Restarting server')
    
    // Begin by setting status to STOPPING
    this.emitStatusChange(ServerStatus.STOPPING)
    
    if (this.manager.isRunning()) {
      this.manager.stopServer()
    }
    
    // Wait until the server is completely stopped
    await new Promise<void>((resolve) => {
      const checkStopped = async () => {
        const health = await this.checkServerHealth()
        if (health.status !== 'ok') {
          resolve()
        } else {
          setTimeout(checkStopped, 1000)
        }
      }
      checkStopped()
    })
    
    // Emit stopped status
    this.emitStatusChange(ServerStatus.STOPPED)
    
    // Now initiate startup by emitting starting state and starting server
    this.emitStatusChange(ServerStatus.STARTING)
    try {
      await this.manager.startServer()
      // When the server is ready, onReady callback will emit RUNNING
      return this.getStatus()
    } catch (error) {
      logger.error('ServerStatusManager: Restart failed:', error)
      this.emitStatusChange(ServerStatus.ERROR, error instanceof Error ? error.message : String(error))
      return {
        status: ServerStatus.ERROR,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Check server health.
   */
  async checkServerHealth(): Promise<any> {
    try {
      logger.info('ServerStatusManager: Checking server health')
      if (!this.manager.isRunning()) {
        return {
          status: 'starting',
          message: 'Server is not running'
        }
      }
      
      const urls = this.manager.getServerUrls()
      const response = await axios.get(urls.health, { timeout: 5000 })
      
      if (response.status === 200) {
        this.healthCheckStatus = 'Healthy'
        this.emitStatusChange(ServerStatus.RUNNING)
        return {
          status: 'ok',
          data: response.data
        }
      } else {
        this.healthCheckStatus = `Error: Unexpected response status ${response.status}`
        return {
          status: 'error',
          message: this.healthCheckStatus
        }
      }
    } catch (error) {
      logger.error('ServerStatusManager: Health check failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.healthCheckStatus = `Error: ${errorMessage}`
      return {
        status: 'error',
        message: errorMessage
      }
    }
  }
  
  /**
   * Get the current server status.
   */
  getStatus(): any {
    const isRunning = this.manager.isRunning()
    const urls = this.manager.getServerUrls()
    
    return {
      status: isRunning ? ServerStatus.RUNNING : ServerStatus.STARTING,
      urls,
      healthCheckStatus: this.healthCheckStatus
    }
  }
  
  /**
   * Emit status change event.
   */
  private emitStatusChange(status: ServerStatus, message?: string): void {
    const urls = this.manager.getServerUrls()
    const statusObject = {
      status,
      urls,
      message,
      healthCheckStatus: this.healthCheckStatus
    }
    
    logger.info(`ServerStatusManager: Emitting status change: ${status}`)
    this.emit('status-change', statusObject)
  }
}