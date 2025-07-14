import { spawn, execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import isDev from 'electron-is-dev'
import { StdioOptions } from 'child_process'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'

export class MacOSServerManager extends BaseServerManager {
  private executableInsideApp: string = ''

  /**
   * Get path to the server executable for macOS.
   */
  protected getServerPath(): string {
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    const appBundlePath = path.join(resourcePath, 'autobyteus_server.app')
    if (fs.existsSync(appBundlePath)) {
      this.executableInsideApp = path.join(appBundlePath, 'Contents', 'MacOS', 'autobyteus_server')
      return appBundlePath
    }
    return path.join(resourcePath, 'autobyteus_server')
  }

  /**
   * Launch the server process for macOS.
   */
  protected async launchServerProcess(): Promise<void> {
    const serverPath = this.getServerPath()
    const isAppBundle = serverPath.endsWith('.app')
    const executablePath = isAppBundle ? this.executableInsideApp : serverPath
    
    logger.info(`Server app bundle path: ${serverPath}`)
    logger.info(`Executable path: ${executablePath}`)
    
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Server executable not found at: ${executablePath}`)
    }
    
    try {
      fs.accessSync(executablePath, fs.constants.X_OK)
    } catch (error) {
      logger.warn(`Executable permissions issue, attempting to chmod: ${executablePath}`)
      try {
        execSync(`chmod +x "${executablePath}"`)
      } catch (chmodError) {
        logger.error(`Failed to set executable permissions: ${chmodError}`)
        throw new Error(`Failed to set executable permissions on ${executablePath}`)
      }
    }
    
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
    
    const formattedPath = executablePath.includes(' ') ? `"${executablePath}"` : executablePath
    logger.info(`Executing: ${formattedPath} ${args.join(' ')}`)
    
    this.serverProcess = spawn(executablePath, args, options)
    
    if (!this.serverProcess || !this.serverProcess.pid) {
      throw new Error(`Failed to spawn server process at ${executablePath}`)
    }
    
    logger.info(`Server process spawned with PID: ${this.serverProcess.pid}`)
    this.setupProcessHandlers()
  }

  /**
   * Get the platform-specific cache directory path for Autobyteus.
   */
  public getCacheDir(): string {
    return path.join(os.homedir(), '.cache', 'autobyteus')
  }
}
