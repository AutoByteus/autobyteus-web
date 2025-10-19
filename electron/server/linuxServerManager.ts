import { spawn } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import isDev from 'electron-is-dev'
import { StdioOptions } from 'child_process'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'
import { getLocalIp } from '../utils/networkUtils'

export class LinuxServerManager extends BaseServerManager {
  /**
   * Get path to the server executable for Linux.
   */
  protected getServerPath(): string {
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    const executableName = 'autobyteus_server'
    return path.join(resourcePath, executableName)
  }

  /**
   * Launch the server process for Linux.
   */
  protected async launchServerProcess(): Promise<void> {
    const serverPath = this.getServerPath()
    
    // Dynamically determine the host IP, falling back to localhost if needed.
    const hostIp = getLocalIp() || 'localhost'
    const publicServerUrl = `http://${hostIp}:${this.serverPort}`
    
    const env = {
      ...process.env,
      PORT: this.serverPort.toString(),
      SERVER_PORT: this.serverPort.toString(),
      // Explicitly provide the server with its public-facing URL.
      AUTOBYTEUS_SERVER_HOST: publicServerUrl
    }
    const options = {
      cwd: this.serverDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'] as StdioOptions
    }

    logger.info(`Starting server with port: ${this.serverPort}`)
    logger.info(`Setting AUTOBYTEUS_SERVER_HOST to: ${publicServerUrl}`)
    logger.info(`Working directory: ${this.serverDir}`)
    logger.info(`App data directory: ${this.appDataDir}`)
    
    const args = [
      `--port`, `${this.serverPort}`,
      `--data-dir`, `${this.appDataDir}`
    ]
    
    const formattedPath = serverPath.includes(' ') ? `"${serverPath}"` : serverPath
    logger.info(`Executing: ${formattedPath} ${args.join(' ')}`)
    
    this.serverProcess = spawn(serverPath, args, options)
    this.setupProcessHandlers()
  }

  /**
   * Get the platform-specific cache directory path for Autobyteus.
   */
  public getCacheDir(): string {
    return path.join(os.homedir(), '.cache', 'autobyteus')
  }
}
