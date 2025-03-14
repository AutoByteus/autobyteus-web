import { spawn, ChildProcess, StdioOptions } from 'child_process'
import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import isDev from 'electron-is-dev'
import axios from 'axios'

// Fixed server port
const FIXED_SERVER_PORT = 29695;

/**
 * ServerManager handles lifecycle management of the backend server process
 */
export class ServerManager {
  private serverProcess: ChildProcess | null = null
  private isServerRunning: boolean = false
  private serverPort: number = FIXED_SERVER_PORT
  private serverUrl: string = `http://localhost:${FIXED_SERVER_PORT}`
  private ready: boolean = false
  private serverStartTime: number = 0
  private maxStartupTime: number = 60000 // 60 seconds timeout
  private onReadyCallbacks: Array<() => void> = []
  private onErrorCallbacks: Array<(error: Error) => void> = []
  private appDataDir: string = ''
  private firstRun: boolean = false
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    // Initialize the app data directory
    this.initAppDataDir()
  }

  /**
   * Initialize the application data directory
   */
  private initAppDataDir(): void {
    // Use the standard app data location (platform specific)
    // For Linux: ~/.config/autobyteus
    // For macOS: ~/Library/Application Support/autobyteus
    // For Windows: C:\Users\<user>\AppData\Roaming\autobyteus
    this.appDataDir = path.join(app.getPath('userData'), 'server-data')
    
    // Check if this is the first run by checking if the directory exists
    this.firstRun = !fs.existsSync(this.appDataDir)
    
    // Create the directory if it doesn't exist
    if (this.firstRun) {
      try {
        fs.mkdirSync(this.appDataDir, { recursive: true })
        console.log(`Created app data directory: ${this.appDataDir}`)
      } catch (error) {
        console.error('Failed to create app data directory:', error)
        throw new Error(`Failed to create app data directory at ${this.appDataDir}: ${error}`)
      }
    }
  }

  /**
   * Initialize the application data for first run
   * This creates the required directories in the app data directory
   * and copies the .env file from the server directory
   */
  private initializeFirstRun(serverDir: string): void {
    console.log('Performing first-run initialization...')
    
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
          console.log(`Created directory: ${dirPath}`)
        }
      }
      
      // Copy .env file on first run (but don't update it later)
      const envFileSrc = path.join(serverDir, '.env')
      const envFileDest = path.join(this.appDataDir, '.env')
      fs.copyFileSync(envFileSrc, envFileDest)
      console.log(`Copied .env file to: ${envFileDest}`)
      
      // Handle download directory content if it exists in the server directory
      const downloadSrcDir = path.join(serverDir, 'download')
      const downloadDestDir = path.join(this.appDataDir, 'download')
      if (fs.existsSync(downloadSrcDir)) {
        try {
          this.copyDirectory(downloadSrcDir, downloadDestDir)
          console.log(`Copied download directory contents to: ${downloadDestDir}`)
        } catch (copyError) {
          console.warn(`Warning: Failed to copy download directory contents: ${copyError}`)
          // Continue execution as this is not critical
        }
      }
      
      console.log('First-run initialization completed successfully')
    } catch (error) {
      console.error('Error during first-run initialization:', error)
      throw new Error(`Failed to initialize app data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Recursively copy a directory
   */
  private copyDirectory(sourceDir: string, destDir: string): void {
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
   * @returns An array of error messages, empty if all requirements are met
   */
  private validateServerEnvironment(serverDir: string): string[] {
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
   * Start the backend server
   */
  public async startServer(): Promise<void> {
    if (this.isServerRunning) {
      console.log('Server is already running')
      return
    }

    try {
      // Set the server URL based on the fixed port
      this.serverUrl = `http://localhost:${this.serverPort}`
      
      const serverPath = this.getServerPath()
      const serverDir = path.dirname(serverPath)
      
      console.log(`Server installation directory: ${serverDir}`)
      console.log(`App data directory: ${this.appDataDir}`)

      // If this is the first run, initialize the app data directory
      if (this.firstRun) {
        this.initializeFirstRun(serverDir)
      }
      
      // Validate server environment
      const validationErrors = this.validateServerEnvironment(serverDir)
      if (validationErrors.length > 0) {
        const errorMessage = `Server environment validation failed:\n- ${validationErrors.join('\n- ')}`
        console.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Start the server process
      this.serverStartTime = Date.now()
      this.serverProcess = this.spawnServerProcess(serverPath, serverDir)
      this.setupProcessHandlers()

      // Wait for server to be ready
      await this.waitForServerReady()
    } catch (error) {
      console.error('Failed to start server:', error)
      this.notifyError(error instanceof Error ? error : new Error(`${error}`))
      throw error
    }
  }

  /**
   * Stop the backend server
   */
  public stopServer(): void {
    if (!this.serverProcess) {
      console.log('Server is not running')
      return
    }

    console.log('Stopping server...')
    this.isServerRunning = false
    this.ready = false

    // Stop health check polling
    this.stopHealthCheckPolling()

    try {
      // Different shutdown methods for different platforms
      if (process.platform === 'win32') {
        // On Windows, we need to terminate the process tree
        // Make sure pid exists before using it
        if (this.serverProcess.pid !== undefined) {
          console.log(`Executing: taskkill /pid ${this.serverProcess.pid} /f /t`)
          spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t'])
        }
      } else {
        // On macOS and Linux, we can send SIGTERM
        console.log('Sending SIGTERM signal to server process')
        this.serverProcess.kill('SIGTERM')
      }
    } catch (error) {
      console.error('Error stopping server:', error)
    }

    this.serverProcess = null
  }

  /**
   * Start polling the health check endpoint
   */
  private startHealthCheckPolling(): void {
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
  private stopHealthCheckPolling(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Check if the server is healthy by calling the health check endpoint
   */
  private async checkServerHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/rest/health`, {
        timeout: 2000 // 2 second timeout
      })
      
      if (response.status === 200 && response.data.status === 'ok') {
        console.log('Server health check successful, server is ready')
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
   * Get path to the server executable based on the platform
   */
  private getServerPath(): string {
    const platform = process.platform
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    let executableName = 'autobyteus_server'
    
    if (platform === 'win32') {
      executableName += '.exe'
    } else if (platform === 'darwin') {
      // Check if we have a macOS app bundle or a direct executable
      const appBundlePath = path.join(resourcePath, 'autobyteus_server.app')
      if (fs.existsSync(appBundlePath)) {
        // Return the path to the executable inside the app bundle
        return path.join(appBundlePath, 'Contents', 'MacOS', 'autobyteus_server')
      }
    }
    
    return path.join(resourcePath, executableName)
  }

  /**
   * Spawn the server process with appropriate options for the platform
   */
  private spawnServerProcess(serverPath: string, serverDir: string): ChildProcess {
    // Create environment with only the necessary variables
    const env = {
      ...process.env,
      PORT: this.serverPort.toString(),
      SERVER_PORT: this.serverPort.toString()
    }

    const options = {
      cwd: serverDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'] as StdioOptions
    }

    console.log(`Starting server with port: ${this.serverPort}`)
    console.log(`Working directory: ${serverDir}`)
    console.log(`App data directory: ${this.appDataDir}`)
    console.log(`Database directory: ${path.join(this.appDataDir, 'db')}`)
    console.log(`Logs directory: ${path.join(this.appDataDir, 'logs')}`)
    console.log(`Download directory: ${path.join(this.appDataDir, 'download')}`)

    if (process.platform === 'darwin' && serverPath.includes('.app/Contents/MacOS')) {
      // For macOS app bundles, we need special handling
      const args = [
        '-n', 
        serverPath, 
        '--args', 
        `--port`, `${this.serverPort}`,
        `--data-dir`, `${this.appDataDir}`
      ];
      console.log(`Executing: open ${args.join(' ')}`);
      console.log(`Full command: open -n "${serverPath}" --args --port ${this.serverPort} --data-dir ${this.appDataDir}`);
      return spawn('open', args, options);
    } else {
      // For direct executables, pass the port and data directory as command-line arguments
      const args = [
        `--port`, `${this.serverPort}`,
        `--data-dir`, `${this.appDataDir}`
      ];
      
      // Format the command for logging, with proper quotes for paths that might contain spaces
      const formattedPath = serverPath.includes(' ') ? `"${serverPath}"` : serverPath;
      console.log(`Executing: ${formattedPath} ${args.join(' ')}`);
      console.log(`Full command: ${serverPath} ${args.join(' ')}`);
      
      return spawn(serverPath, args, options);
    }
  }

  /**
   * Set up event handlers for the server process
   */
  private setupProcessHandlers(): void {
    if (!this.serverProcess) return

    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      console.log(`Server stdout: ${output}`)

      // Check for server ready message in stdout
      if (this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.notifyReady()
      }
    })

    this.serverProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      console.error(`Server stderr: ${output}`)
      
      // Also check for server ready messages in stderr
      // Some servers output their startup messages to stderr
      if (this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.notifyReady()
      }
    })

    this.serverProcess.on('error', (error) => {
      console.error('Server process error:', error)
      this.isServerRunning = false
      this.ready = false
      this.notifyError(error)
    })

    this.serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`)
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
  private checkForReadyMessage(output: string): boolean {
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
  private async waitForServerReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
  private notifyReady(): void {
    this.onReadyCallbacks.forEach(callback => callback())
    this.onReadyCallbacks = []
  }

  /**
   * Notify all registered callbacks that an error occurred
   */
  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error))
  }
}

// Create and export a singleton instance
export const serverManager = new ServerManager()
