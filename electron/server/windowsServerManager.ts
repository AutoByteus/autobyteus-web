import { spawn } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import isDev from 'electron-is-dev'
import { StdioOptions } from 'child_process'
import { BaseServerManager } from './baseServerManager'
import { logger } from '../logger'

export class WindowsServerManager extends BaseServerManager {
  /**
   * Get path to the server executable for Windows.
   */
  protected getServerPath(): string {
    const resourcePath = isDev 
      ? path.join(process.cwd(), 'resources', 'server') 
      : path.join(process.resourcesPath, 'server')
    
    const executableName = 'autobyteus_server.exe'
    return path.join(resourcePath, executableName)
  }

  /**
   * Launch the server process for Windows.
   */
  protected async launchServerProcess(): Promise<void> {
    const serverPath = this.getServerPath()
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
    
    const formattedPath = serverPath.includes(' ') ? `"${serverPath}"` : serverPath
    logger.info(`Executing: ${formattedPath} ${args.join(' ')}`)
    
    this.serverProcess = spawn(serverPath, args, options)
    this.setupProcessHandlers()
  }

  /**
   * Stop the backend server.
   */
  public stopServer(): void {
    if (!this.serverProcess) {
      logger.info('Server is not running')
      return
    }

    logger.info('Stopping server...')
    this.isServerRunning = false
    this.ready = false
    this.stopHealthCheckPolling()

    try {
      if (this.serverProcess.pid !== undefined) {
        logger.info(`Executing: taskkill /pid ${this.serverProcess.pid} /f /t`)
        spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t'])
      }
    } catch (error) {
      logger.error('Error stopping server:', error)
    }

    this.serverProcess = null
  }

  /**
   * Get the platform-specific cache directory path for Autobyteus.
   */
  public getCacheDir(): string {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    return path.join(localAppData, 'autobyteus')
  }
}
