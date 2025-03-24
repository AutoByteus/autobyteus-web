import { ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import axios from 'axios'
import { logger } from '../logger'

// Fixed server port
export const FIXED_SERVER_PORT = 29695

/**
 * Base server manager with platform-agnostic functionality
 */
export abstract class BaseServerManager {
  protected serverProcess: ChildProcess | null = null
  protected isServerRunning: boolean = false
  protected serverPort: number = FIXED_SERVER_PORT
  protected serverUrl: string = `http://localhost:${FIXED_SERVER_PORT}`
  protected ready: boolean = false
  protected serverStartTime: number = 0
  protected maxStartupTime: number = 60000 // 60 seconds timeout
  protected onReadyCallbacks: Array<() => void> = []
  protected onErrorCallbacks: Array<(error: Error) => void> = []
  protected appDataDir: string = ''
  protected firstRun: boolean = false
  protected healthCheckInterval: NodeJS.Timeout | null = null
  protected serverDir: string = ''
  protected isExternalServerDetected: boolean = false

  constructor() {
    // Initialize the app data directory
    this.initAppDataDir()
  }

  /**
   * Initialize the application data directory
   */
  protected initAppDataDir(): void {
    // Use the standard app data location (platform specific)
    this.appDataDir = path.join(app.getPath('userData'), 'server-data')
    
    // Check if this is the first run by checking if the directory exists
    this.firstRun = !fs.existsSync(this.appDataDir)
    
    // Create the directory if it doesn't exist
    if (this.firstRun) {
      try {
        fs.mkdirSync(this.appDataDir, { recursive: true })
        logger.info(`Created app data directory: ${this.appDataDir}`)
      } catch (error) {
        logger.error('Failed to create app data directory:', error)
        throw new Error(`Failed to create app data directory at ${this.appDataDir}: ${error}`)
      }
    }
  }

  /**
   * Initialize the application data for first run
   */
  protected initializeFirstRun(serverDir: string): void {
    logger.info('Performing first-run initialization...')
    
    try {
      // Check for required files in the server directory before proceeding
      const requiredServerFiles = ['alembic.ini', 'logging_config.ini', '.env']
      for (const file of requiredServerFiles) {
        const filePath = path.join(serverDir, file)
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required server file not found: ${filePath}`)
        }
      }
      
      // Check for required directories in the server directory
      const requiredServerDirs = ['alembic']
      for (const dir of requiredServerDirs) {
        const dirPath = path.join(serverDir, dir)
        if (!fs.existsSync(dirPath)) {
          throw new Error(`Required server directory not found: ${dirPath}`)
        }
      }
      
      // Create the app data directory if it doesn't exist
      if (!fs.existsSync(this.appDataDir)) {
        fs.mkdirSync(this.appDataDir, { recursive: true })
      }
      
      // Create required subdirectories in the app data directory
      const requiredDataDirs = ['db', 'logs', 'download']
      for (const dir of requiredDataDirs) {
        const dirPath = path.join(this.appDataDir, dir)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
          logger.info(`Created directory: ${dirPath}`)
        }
      }
      
      // Copy .env file on first run (but don't update it later)
      const envFileSrc = path.join(serverDir, '.env')
      const envFileDest = path.join(this.appDataDir, '.env')
      fs.copyFileSync(envFileSrc, envFileDest)
      logger.info(`Copied .env file to: ${envFileDest}`)
      
      // Handle download directory content if it exists in the server directory
      const downloadSrcDir = path.join(serverDir, 'download')
      const downloadDestDir = path.join(this.appDataDir, 'download')
      if (fs.existsSync(downloadSrcDir)) {
        try {
          this.copyDirectory(downloadSrcDir, downloadDestDir)
          logger.info(`Copied download directory contents to: ${downloadDestDir}`)
        } catch (copyError) {
          logger.warn(`Warning: Failed to copy download directory contents: ${copyError}`)
          // Continue execution as this is not critical
        }
      }
      
      logger.info('First-run initialization completed successfully')
    } catch (error) {
      logger.error('Error during first-run initialization:', error)
      throw new Error(`Failed to initialize app data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Recursively copy a directory
   */
  protected copyDirectory(sourceDir: string, destDir: string): void {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    
    // Get all files and subdirectories in the source directory
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
    
    // Process each entry
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name)
      const destPath = path.join(destDir, entry.name)
      
      if (entry.isDirectory()) {
        // Recursively copy subdirectories
        this.copyDirectory(sourcePath, destPath)
      } else {
        // Copy files
        fs.copyFileSync(sourcePath, destPath)
      }
    }
  }

  /**
   * Validate that all required files and directories exist
   */
  protected validateServerEnvironment(serverDir: string): string[] {
    const errors: string[] = []
    
    // Check that the server executable exists
    const serverPath = this.getServerPath()
    if (!fs.existsSync(serverPath)) {
      errors.push(`Server executable not found at: ${serverPath}`)
    }
    
    // Check for required files in the server directory
    const requiredServerFiles = ['alembic.ini', 'logging_config.ini']
    for (const file of requiredServerFiles) {
      const filePath = path.join(serverDir, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`Required server file not found: ${filePath}`)
      }
    }
    
    // Check for required directories in the server directory
    const requiredServerDirs = ['alembic']
    for (const dir of requiredServerDirs) {
      const dirPath = path.join(serverDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required server directory not found: ${dirPath}`)
      }
    }
    
    // Check for required directories in app data
    const requiredDataDirs = ['logs', 'db', 'download']
    for (const dir of requiredDataDirs) {
      const dirPath = path.join(this.appDataDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required data directory not found: ${dirPath}`)
      }
    }
    
    // Check for .env file in app data
    const envFilePath = path.join(this.appDataDir, '.env')
    if (!fs.existsSync(envFilePath)) {
      errors.push(`Required config file not found: ${envFilePath}`)
    }
    
    return errors
  }

  /**
   * Check if a server is already running at the configured port
   * @returns Promise<boolean> True if a server is already running and healthy
   */
  public async checkExistingServer(): Promise<boolean> {
    logger.info(`Checking if server is already running at ${this.serverUrl}...`)
    
    try {
      // Set the server URL based on the fixed port
      this.serverUrl = `http://localhost:${this.serverPort}`
      
      // Try to connect to the health endpoint with a short timeout
      const response = await axios.get(`${this.serverUrl}/rest/health`, {
        timeout: 2000 // 2 second timeout
      })
      
      if (response.status === 200 && response.data.status === 'ok') {
        logger.info('Existing server found and it is healthy')
        this.isServerRunning = true
        this.ready = true
        this.isExternalServerDetected = true
        // Notify that the server is ready since we found an existing one
        this.notifyReady()
        return true
      } else {
        logger.info('Server responded but health check failed:', response.status, response.data)
        return false
      }
    } catch (error) {
      logger.info('No existing server found or server not healthy:', error instanceof Error ? error.message : String(error))
      return false
    }
  }

  /**
   * Start the backend server
   */
  public async startServer(): Promise<void> {
    // First check if a server is already running
    if (await this.checkExistingServer()) {
      logger.info('Using existing server - no need to start a new instance')
      return
    }
    
    if (this.isServerRunning) {
      logger.info('Server is already running')
      return
    }

    try {
      // Set the server URL based on the fixed port
      this.serverUrl = `http://localhost:${this.serverPort}`
      
      const serverPath = this.getServerPath()
      this.serverDir = path.dirname(serverPath)
      
      logger.info(`Server installation directory: ${this.serverDir}`)
      logger.info(`App data directory: ${this.appDataDir}`)

      // If this is the first run, initialize the app data directory
      if (this.firstRun) {
        this.initializeFirstRun(this.serverDir)
      }
      
      // Validate server environment
      const validationErrors = this.validateServerEnvironment(this.serverDir)
      if (validationErrors.length > 0) {
        const errorMessage = `Server environment validation failed:\n- ${validationErrors.join('\n- ')}`
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Start the server process
      this.serverStartTime = Date.now()
      this.isExternalServerDetected = false // This is an internal server we're starting
      
      // This is implemented by platform-specific classes
      await this.launchServerProcess()
      
      // Wait for server to be ready
      await this.waitForServerReady()
    } catch (error) {
      logger.error('Failed to start server:', error)
      this.notifyError(error instanceof Error ? error : new Error(`${error}`))
      throw error
    }
  }

  /**
   * Launch the server process - to be implemented by platform-specific subclasses
   */
  protected abstract launchServerProcess(): Promise<void>;

  /**
   * Stop the backend server - may be overridden by platform-specific subclasses
   */
  public stopServer(): void {
    if (!this.serverProcess) {
      logger.info('Server is not running or not managed by this application')
      return
    }

    // If we detected an external server that we didn't start, don't stop it
    if (this.isExternalServerDetected) {
      logger.info('Server was already running when application started - not stopping it')
      return
    }

    logger.info('Stopping server...')
    this.isServerRunning = false
    this.ready = false

    // Stop health check polling
    this.stopHealthCheckPolling()

    try {
      // Default implementation - send SIGTERM
      logger.info('Sending SIGTERM signal to server process')
      this.serverProcess.kill('SIGTERM')
    } catch (error) {
      logger.error('Error stopping server:', error)
    }

    this.serverProcess = null
  }

  /**
   * Start polling the health check endpoint
   */
  protected startHealthCheckPolling(): void {
    // Stop any existing polling
    this.stopHealthCheckPolling()
    
    // Poll the health check endpoint every 1 second
    this.healthCheckInterval = setInterval(() => {
      // Don't poll if server is already marked as ready
      if (this.ready) {
        this.stopHealthCheckPolling()
        return
      }
      
      this.checkServerHealth()
    }, 1000)
  }

  /**
   * Stop polling the health check endpoint
   */
  protected stopHealthCheckPolling(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Check if the server is healthy by calling the health check endpoint
   */
  protected async checkServerHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/rest/health`, {
        timeout: 2000 // 2 second timeout
      })
      
      if (response.status === 200 && response.data.status === 'ok') {
        logger.info('Server health check successful, server is ready')
        this.isServerRunning = true
        this.ready = true
        this.notifyReady()
      }
    } catch (error) {
      // Ignore errors during health check polling
      // We don't want to report these as server failures
    }
  }

  /**
   * Register a callback to be called when the server is ready
   */
  public onReady(callback: () => void): void {
    if (this.ready) {
      callback()
    } else {
      this.onReadyCallbacks.push(callback)
    }
  }

  /**
   * Register a callback to be called when the server encounters an error
   */
  public onError(callback: (error: Error) => void): void {
    this.onErrorCallbacks.push(callback)
  }

  /**
   * Check if the server is running
   */
  public isRunning(): boolean {
    return this.isServerRunning && this.ready
  }

  /**
   * Get the server port
   */
  public getServerPort(): number {
    return this.serverPort
  }

  /**
   * Get the server URL (base URL without path)
   */
  public getServerBaseUrl(): string {
    return this.serverUrl
  }

  /**
   * Check if the detected server was externally started
   */
  public isExternalServer(): boolean {
    return this.isExternalServerDetected
  }

  /**
   * Get the server API URLs for all required endpoints
   */
  public getServerUrls(): {
    graphql: string;
    rest: string;
    ws: string;
    transcription: string;
    health: string;
  } {
    return {
      graphql: `${this.serverUrl}/graphql`,
      rest: `${this.serverUrl}/rest`,
      ws: `ws://localhost:${this.serverPort}/graphql`,
      transcription: `ws://localhost:${this.serverPort}/transcribe`,
      health: `${this.serverUrl}/rest/health`
    }
  }

  /**
   * Get path to the server executable based on the platform - needs to be implemented by subclasses
   */
  protected abstract getServerPath(): string;

  /**
   * Set up event handlers for the server process
   */
  protected setupProcessHandlers(): void {
    if (!this.serverProcess) return

    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      logger.info(`Server stdout: ${output}`)

      // Check for server ready message in stdout
      if (this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.notifyReady()
      }
    })

    this.serverProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      logger.error(`Server stderr: ${output}`)
      
      // Also check for server ready messages in stderr
      // Some servers output their startup messages to stderr
      if (this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.notifyReady()
      }
    })

    this.serverProcess.on('error', (error) => {
      logger.error('Server process error:', error)
      this.isServerRunning = false
      this.ready = false
      this.notifyError(error)
    })

    this.serverProcess.on('close', (code) => {
      logger.info(`Server process exited with code ${code}`)
      this.isServerRunning = false
      this.ready = false
      this.serverProcess = null

      if (code !== 0 && code !== null) {
        this.notifyError(new Error(`Server process exited with code ${code}`))
      }
    })
  }

  /**
   * Check if the given output contains server ready messages
   */
  protected checkForReadyMessage(output: string): boolean {
    // Check various patterns that indicate the server is ready
    return (
      output.includes('Application startup complete') || 
      output.includes('Running on http://') || 
      output.includes('Uvicorn running on') ||
      output.includes('INFO:     Application startup complete') ||
      output.includes('INFO:     Uvicorn running on')
    )
  }

  /**
   * Wait for the server to be ready or timeout
   */
  protected async waitForServerReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Start health check polling immediately
      this.startHealthCheckPolling()
      
      // Check if server is already ready
      if (this.ready) {
        resolve()
        return
      }

      // Set up a timeout
      const timeoutId = setTimeout(() => {
        if (!this.ready) {
          const error = new Error(`Server failed to start within ${this.maxStartupTime / 1000} seconds`)
          this.notifyError(error)
          reject(error)
        }
      }, this.maxStartupTime)

      // Set up a callback for when the server is ready
      this.onReady(() => {
        clearTimeout(timeoutId)
        resolve()
      })

      // Set up a callback for when the server errors
      this.onError((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
    })
  }

  /**
   * Notify all registered callbacks that the server is ready
   */
  protected notifyReady(): void {
    this.onReadyCallbacks.forEach(callback => callback())
    this.onReadyCallbacks = []
  }

  /**
   * Notify all registered callbacks that an error occurred
   */
  protected notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error))
  }
}
