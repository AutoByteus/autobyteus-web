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
   * Stop the backend server on Windows using taskkill.
   */
  public stopServer(): Promise<void> {
    if (!this.serverProcess) {
      logger.info('Server is not running');
      return Promise.resolve();
    }

    logger.info('Stopping server on Windows...');

    return new Promise((resolve) => {
        const pid = this.serverProcess?.pid;
        this.serverProcess = null; // Detach original process object

        if (pid) {
            const killProcess = spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
            
            const cleanup = () => {
                this.isServerRunning = false;
                this.ready = false;
                this.emit('stopped');
                resolve();
            }

            killProcess.on('close', () => {
                logger.info(`taskkill for PID ${pid} completed.`);
                cleanup();
            });

            killProcess.on('error', (err) => {
                logger.error(`taskkill failed for PID ${pid}:`, err);
                cleanup(); // Resolve even on error to not hang
            });
        } else {
            logger.warn('Server process exists but has no PID. Cannot kill.');
            this.isServerRunning = false;
            this.ready = false;
            this.emit('stopped');
            resolve();
        }
    });
  }

  /**
   * Get the platform-specific cache directory path for Autobyteus.
   */
  public getCacheDir(): string {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    return path.join(localAppData, 'autobyteus')
  }
}
