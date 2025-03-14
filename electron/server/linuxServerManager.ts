import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import isDev from 'electron-is-dev'
import { StdioOptions } from 'child_process'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'

export class LinuxServerManager extends BaseServerManager {
  /**
   * Get path to the server executable for Linux
   */
  protected getServerPath(): string {
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    const executableName = 'autobyteus_server'
    return path.join(resourcePath, executableName)
  }

  /**
   * Launch the server process for Linux
   */
  protected async launchServerProcess(): Promise<void> {
    const serverPath = this.getServerPath()
    
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
    const formattedPath = serverPath.includes(' ') ? `"${serverPath}"` : serverPath
    logger.info(`Executing: ${formattedPath} ${args.join(' ')}`)
    
    this.serverProcess = spawn(serverPath, args, options)
    this.setupProcessHandlers()
  }
}
