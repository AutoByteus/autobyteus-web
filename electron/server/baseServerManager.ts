import { ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as net from 'net'
import { app } from 'electron'
import axios from 'axios'
import { EventEmitter } from 'events'
import { logger } from '../logger'

// Fixed server port
export const FIXED_SERVER_PORT = 29695

/**
 * Base server manager with platform-agnostic functionality.
 * Simplified to always use an internal server.
 * Now extends EventEmitter for robust event handling.
 */
export abstract class BaseServerManager extends EventEmitter {
  protected serverProcess: ChildProcess | null = null
  protected isServerRunning: boolean = false
  protected serverPort: number = FIXED_SERVER_PORT
  protected serverUrl: string = `http://localhost:${FIXED_SERVER_PORT}`
  protected ready: boolean = false
  protected serverStartTime: number = 0
  protected maxStartupTime: number = 100000 // 100 seconds timeout
  protected appDataDir: string = ''
  protected firstRun: boolean = false
  protected serverDir: string = ''
  protected gracefulShutdownTimeoutMs: number = 5000  // 5 seconds for graceful shutdown

  constructor() {
    super()
    // Initialize the app data directory
    this.initAppDataDir()
  }

  /**
   * Initialize the application data directory.
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
   * Initialize the application data for first run.
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

      // Copy download directory if it exists in the server directory
      const downloadSrcDir = path.join(serverDir, 'download')
      const downloadDestDir = path.join(this.appDataDir, 'download')
      if (fs.existsSync(downloadSrcDir)) {
        try {
          this.copyDirectory(downloadSrcDir, downloadDestDir)
          logger.info(`Copied download directory contents to: ${downloadDestDir}`)
        } catch (copyError) {
          logger.warn(`Warning: Failed to copy download directory contents: ${copyError}`)
        }
      }

      logger.info('First-run initialization completed successfully')
      this.firstRun = false
    } catch (error) {
      logger.error('Error during first-run initialization:', error)
      throw new Error(`Failed to initialize app data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Recursively copy a directory.
   */
  protected copyDirectory(sourceDir: string, destDir: string): void {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name)
      const destPath = path.join(destDir, entry.name)
      if (entry.isDirectory()) {
        this.copyDirectory(sourcePath, destPath)
      } else {
        fs.copyFileSync(sourcePath, destPath)
      }
    }
  }

  /**
   * Validate that all required files and directories exist.
   */
  protected validateServerEnvironment(serverDir: string): string[] {
    const errors: string[] = []
    const serverPath = this.getServerPath()
    if (!fs.existsSync(serverPath)) {
      errors.push(`Server executable not found at: ${serverPath}`)
    }
    const requiredServerFiles = ['alembic.ini', 'logging_config.ini']
    for (const file of requiredServerFiles) {
      const filePath = path.join(serverDir, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`Required server file not found: ${filePath}`)
      }
    }
    const requiredServerDirs = ['alembic']
    for (const dir of requiredServerDirs) {
      const dirPath = path.join(serverDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required server directory not found: ${dirPath}`)
      }
    }
    const requiredDataDirs = ['logs', 'db', 'download']
    for (const dir of requiredDataDirs) {
      const dirPath = path.join(this.appDataDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required data directory not found: ${dirPath}`)
      }
    }
    const envFilePath = path.join(this.appDataDir, '.env')
    if (!fs.existsSync(envFilePath)) {
      errors.push(`Required config file not found: ${envFilePath}`)
    }
    return errors
  }

  /**
   * Wait for the server port to be free before starting the server.
   * This is to ensure that TIME_WAIT state has cleared.
   */
  protected async waitForPortToBeFree(timeoutMs: number = (process.platform === 'linux' ? 10000 : 5000)): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const isFree = await new Promise<boolean>((resolve) => {
        const tester = net.createServer()
          .once('error', () => {
            resolve(false);
          })
          .once('listening', () => {
            tester.close(() => resolve(true));
          })
          .listen(this.serverPort);
      });
      if (isFree) {
        logger.info(`Port ${this.serverPort} is free.`);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Port ${this.serverPort} is still in use after ${timeoutMs}ms`);
  }

  /**
   * Start the backend server.
   * Always starts a new internal server.
   */
  public async startServer(): Promise<void> {
    if (this.isServerRunning) {
      logger.info('Server is already running')
      return
    }

    try {
      this.serverUrl = `http://localhost:${this.serverPort}`
      const serverPath = this.getServerPath()
      this.serverDir = path.dirname(serverPath)
      
      logger.info(`Server installation directory: ${this.serverDir}`)
      logger.info(`App data directory: ${this.appDataDir}`)
      
      if (this.firstRun) {
        this.initializeFirstRun(this.serverDir)
      }
      
      const validationErrors = this.validateServerEnvironment(this.serverDir)
      if (validationErrors.length > 0) {
        const errorMessage = `Server environment validation failed:\n- ${validationErrors.join('\n- ')}`
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      this.serverStartTime = Date.now()

      // Wait for the port to be free to avoid TIME_WAIT conflicts
      await this.waitForPortToBeFree();

      // Always start a new internal server process.
      await this.launchServerProcess()
      await this.waitForServerReady()
    } catch (error) {
      logger.error('Failed to start server:', error)
      this.emit('error', error instanceof Error ? error : new Error(`${error}`))
      throw error
    }
  }

  /**
   * Launch the server process - to be implemented by platform-specific subclasses.
   */
  protected abstract launchServerProcess(): Promise<void>;

  /**
   * Stop the backend server with graceful-to-forceful fallback.
   * First sends SIGTERM for graceful shutdown, then escalates to SIGKILL if timeout expires.
   */
  public stopServer(): Promise<void> {
    if (!this.serverProcess) {
      logger.info('Server is not running');
      return Promise.resolve();
    }
    
    const proc = this.serverProcess;

    return new Promise((resolve) => {
      let forceKillTimeout: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(forceKillTimeout);
        this.isServerRunning = false;
        this.ready = false;
        this.serverProcess = null;
        this.emit('stopped');
      };
      
      // When process closes, cleanup and resolve
      proc.once('close', () => {
        logger.info('Server process closed');
        cleanup();
        resolve();
      });

      logger.info('Stopping server...');
      
      try {
        // Step 1: Send SIGTERM for graceful shutdown
        logger.info('Sending SIGTERM signal for graceful shutdown');
        proc.kill('SIGTERM');
        
        // Step 2: Set timeout to escalate to SIGKILL if graceful fails
        forceKillTimeout = setTimeout(() => {
          if (this.serverProcess) {
            logger.warn(`Graceful shutdown timed out after ${this.gracefulShutdownTimeoutMs}ms, sending SIGKILL`);
            try {
              proc.kill('SIGKILL');
            } catch (killError) {
              logger.error('Error sending SIGKILL:', killError);
              // Process is likely already gone, cleanup
              cleanup();
              resolve();
            }
          }
        }, this.gracefulShutdownTimeoutMs);
      } catch (error) {
        logger.error('Error sending SIGTERM to server:', error);
        // If kill fails, assume process is gone and cleanup state manually.
        cleanup();
        resolve();
      }
    });
  }

  /**
   * Check if the server is healthy by calling the health check endpoint.
   */
  protected async checkServerHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/rest/health`, {
        timeout: 2000
      })
      if (response.status === 200 && response.data.status === 'ok') {
        logger.info('Server health check successful, server is ready')
        if (!this.ready) {
          this.isServerRunning = true
          this.ready = true
          this.emit('ready')
        }
      }
    } catch (error) {
      // Ignore errors during health check polling.
    }
  }

  /**
   * Check if the server is running.
   */
  public isRunning(): boolean {
    return this.isServerRunning && this.ready
  }

  /**
   * Get the server port.
   */
  public getServerPort(): number {
    return this.serverPort
  }

  /**
   * Get the server URL (base URL without path).
   */
  public getServerBaseUrl(): string {
    return this.serverUrl
  }

  /**
   * Get the server API URLs for all required endpoints.
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
   * Get path to the server executable based on the platform.
   * Must be implemented by subclasses.
   */
  protected abstract getServerPath(): string;

  /**
   * Get the platform-specific cache directory path for Autobyteus.
   */
  public abstract getCacheDir(): string;

  /**
   * Get the application's data directory path.
   */
  public getAppDataDir(): string {
    return this.appDataDir;
  }

  /**
   * Reset the app data directory to a clean state.
   */
  public resetAppDataDir(): void {
    try {
      if (fs.existsSync(this.appDataDir)) {
        fs.rmSync(this.appDataDir, { recursive: true, force: true })
      }
      this.firstRun = true
      this.initAppDataDir()
    } catch (error) {
      logger.error('Failed to reset app data directory:', error)
      throw error
    }
  }

  /**
   * Set up event handlers for the server process.
   */
  protected setupProcessHandlers(): void {
    if (!this.serverProcess) return

    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      logger.info(`Server stdout: ${output}`)
      if (!this.ready && this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.emit('ready')
      }
    })

    this.serverProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      logger.error(`Server stderr: ${output}`)
      if (!this.ready && this.checkForReadyMessage(output)) {
        this.isServerRunning = true
        this.ready = true
        this.emit('ready')
      }
    })

    this.serverProcess.on('error', (error) => {
      logger.error('Server process error:', error)
      this.isServerRunning = false
      this.ready = false
      this.emit('error', error)
    })

    this.serverProcess.on('close', (code) => {
      logger.info(`Server process exited with code ${code}`)
      this.isServerRunning = false
      this.ready = false
      this.serverProcess = null
      this.emit('stopped');
      if (code !== 0 && code !== null) {
        this.emit('error', new Error(`Server process exited with code ${code}`))
      }
    })
  }

  /**
   * Check if the given output contains server ready messages.
   */
  protected checkForReadyMessage(output: string): boolean {
    return (
      output.includes('Application startup complete') || 
      output.includes('Running on http://') || 
      output.includes('Uvicorn running on') ||
      output.includes('INFO:     Application startup complete') ||
      output.includes('INFO:     Uvicorn running on')
    )
  }

  /**
   * Wait for the server to be ready or timeout.
   */
  protected async waitForServerReady(): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;

        const onReadyListener = () => {
            clearTimeout(timeoutId);
            this.removeListener('error', onErrorListener);
            resolve();
        };

        const onErrorListener = (error: Error) => {
            clearTimeout(timeoutId);
            this.removeListener('ready', onReadyListener);
            reject(error);
        };

        this.once('ready', onReadyListener);
        this.once('error', onErrorListener);

        timeoutId = setTimeout(() => {
            this.removeListener('ready', onReadyListener);
            this.removeListener('error', onErrorListener);
            const error = new Error(`Server failed to start within ${this.maxStartupTime / 1000} seconds`);
            this.emit('error', error);
            reject(error);
        }, this.maxStartupTime);
    });
  }
}
