import { spawn, execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import isDev from 'electron-is-dev'
import { StdioOptions } from 'child_process'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'

export class MacOSServerManager extends BaseServerManager {
  private executableInsideApp: string = ''

  /**
   * Get path to the server executable for macOS
   */
  protected getServerPath(): string {
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    // Check if we have a macOS app bundle
    const appBundlePath = path.join(resourcePath, 'autobyteus_server.app')
    if (fs.existsSync(appBundlePath)) {
      // Return the path to the app bundle - we'll handle the executable inside separately
      this.executableInsideApp = path.join(appBundlePath, 'Contents', 'MacOS', 'autobyteus_server')
      return appBundlePath
    }
    
    // Fall back to direct executable if no app bundle
    return path.join(resourcePath, 'autobyteus_server')
  }

  /**
   * Launch the server process for macOS
   * This implementation uses a different approach from the original code
   */
  protected async launchServerProcess(): Promise<void> {
    const serverPath = this.getServerPath()
    const isAppBundle = serverPath.endsWith('.app')
    
    // Determine the actual executable path
    const executablePath = isAppBundle ? this.executableInsideApp : serverPath
    
    // Log file paths for debugging
    logger.info(`Server app bundle path: ${serverPath}`)
    logger.info(`Executable path: ${executablePath}`)
    
    // Check if the executable exists
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Server executable not found at: ${executablePath}`)
    }
    
    // Make sure the executable is executable
    try {
      fs.accessSync(executablePath, fs.constants.X_OK)
    } catch (error) {
      logger.warn(`Executable permissions issue, attempting to chmod: ${executablePath}`)
      // Try to make it executable
      try {
        execSync(`chmod +x "${executablePath}"`)
      } catch (chmodError) {
        logger.error(`Failed to set executable permissions: ${chmodError}`)
        throw new Error(`Failed to set executable permissions on ${executablePath}`)
      }
    }
    
    // Create environment with only the necessary variables
    const env = {
      ...process.env,
      PORT: this.serverPort.toString(),
      SERVER_PORT: this.serverPort.toString()
    }

    const options = {
      cwd: this.serverDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'] as StdioOptions
    }

    logger.info(`Starting server with port: ${this.serverPort}`)
    logger.info(`Working directory: ${this.serverDir}`)
    logger.info(`App data directory: ${this.appDataDir}`)
    
    const args = [
      `--port`, `${this.serverPort}`,
      `--data-dir`, `${this.appDataDir}`
    ]
    
    // Format the command for logging
    const formattedPath = executablePath.includes(' ') ? `"${executablePath}"` : executablePath
    logger.info(`Executing: ${formattedPath} ${args.join(' ')}`)
    
    // Direct execution instead of using 'open'
    this.serverProcess = spawn(executablePath, args, options)
    
    // Check if the process was created successfully
    if (!this.serverProcess || !this.serverProcess.pid) {
      throw new Error(`Failed to spawn server process at ${executablePath}`)
    }
    
    logger.info(`Server process spawned with PID: ${this.serverProcess.pid}`)
    
    // Set up event handlers
    this.setupProcessHandlers()
    
    // Start health check polling as a fallback if stdout/stderr don't show startup
    this.startHealthCheckPolling()
  }
}
