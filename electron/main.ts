import { app, BrowserWindow, ipcMain, shell, protocol, net, dialog } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { serverManager } from './server/serverManagerFactory'
import { logger } from './logger'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import { ServerStatusManager } from './server/serverStatusManager'
import { URL } from 'url'

// Create server status manager
const serverStatusManager = new ServerStatusManager(serverManager);

let mainWindow: BrowserWindow | null
let isQuitting = false; // Flag to prevent multiple shutdown attempts
let shutdownTimer: NodeJS.Timeout | null = null
const shutdownTimeoutMs = 8000

function getWindowIcon(): string {
  const iconFile = '512x512.png'
  const prodPath = path.join(process.resourcesPath, 'icons', iconFile)
  const devPath = path.join(__dirname, '..', '..', 'build', 'icons', iconFile)
  const resolvedPath = app.isPackaged ? prodPath : devPath

  if (!fsSync.existsSync(resolvedPath)) {
    logger.warn(`Window icon not found at ${resolvedPath}. Falling back to Electron default.`)
  }

  return resolvedPath
}

/**
 * Create the main application window.
 */
function createWindow() {
  try {
    const cacheDir = serverManager.getCacheDir()
    logger.info(`Computed cache directory: ${cacheDir}`)
    const userDataPath = app.getPath('userData')
    logger.info(`user data path: ${userDataPath}`)

    logger.info('Creating main window')
    
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: getWindowIcon(),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true, // Sandboxing is recommended for security
      },
      show: true,
    })

    // --- SECURITY ENHANCEMENTS ---
    // Block unintended navigations (file/URL drop, window.location change, etc.)
    mainWindow.webContents.on('will-navigate', (e) => {
      logger.warn(`Blocked navigation attempt to: ${e.url}`)
      e.preventDefault()
    });

    // Block all new windows (e.g., from target="_blank")
    mainWindow.webContents.setWindowOpenHandler(() => {
      logger.warn('Blocked attempt to open a new window.')
      return { action: 'deny' }
    });
    // --- END SECURITY ENHANCEMENTS ---

    // Intercept the close event
    mainWindow.on('close', (event) => {
      logger.info(`'close' event triggered. isQuitting: ${isQuitting}`)
      if (!isQuitting) {
        // Prevent the window from closing immediately
        event.preventDefault()
        isQuitting = true
        // Notify the renderer to show the shutdown screen
        logger.info('Sending app-quitting event to renderer.')
        mainWindow?.webContents.send('app-quitting')

        // Fallback: if renderer does not respond, force shutdown from main process.
        shutdownTimer = setTimeout(async () => {
          logger.warn('Renderer did not acknowledge shutdown. Forcing app quit.')
          try {
            await serverManager.stopServer()
          } catch (error) {
            logger.error('Error stopping server during forced shutdown:', error)
          } finally {
            app.quit()
          }
        }, shutdownTimeoutMs)
      }
      // If isQuitting is true, the app.quit() was called, so let it proceed.
    })

    const startURL = isDev
      ? process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
      : `file://${path.join(__dirname, '../renderer/index.html')}`

    logger.info('Environment:', isDev ? 'Development' : 'Production')
    logger.info('Loading URL:', startURL)
    logger.info('Current directory:', __dirname)
    logger.info('Resolved index.html path:', path.resolve(__dirname, '../renderer/index.html'))
    
    mainWindow.loadURL(startURL)
      .then(() => {
        logger.info('URL loaded successfully')
      })
      .catch(err => {
        logger.error('Failed to load URL:', startURL, err)
      })

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      logger.error('Page failed to load:', {
        errorCode,
        errorDescription,
        validatedURL,
        startURL
      })
    })

    mainWindow.webContents.on('did-finish-load', () => {
      logger.info('Page finished loading')
      const rendererPath = path.join(__dirname, '../renderer')
      logger.info('Renderer directory:', rendererPath)
      try {
        const files = fsSync.readdirSync(rendererPath)
        logger.info('Files in renderer directory:', files)
      } catch (error) {
        logger.error('Error listing renderer directory:', error)
      }

      if (!mainWindow) return
      
      mainWindow.webContents.send('server-status', serverStatusManager.getStatus())
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })
    
    serverStatusManager.on('status-change', (status) => {
      if (mainWindow) {
        mainWindow.webContents.send('server-status', status)
      }
    })
    
  } catch (error) {
    logger.error('Error in createWindow:', error)
  }
}

/**
 * Helper function to clear contents of a directory.
 */
async function clearDirectoryContents(dirPath: string) {
  logger.info(`Starting to clear contents of directory: ${dirPath}`);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      logger.info(`Deleting: ${fullPath}`);
      await fs.rm(fullPath, { recursive: true, force: true });
    }
    logger.info(`Successfully cleared contents of directory: ${dirPath}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to clear directory ${dirPath}:`, error);
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn(`Directory not found, considering it cleared: ${dirPath}`);
      return { success: true }; // If directory doesn't exist, it's already "cleared"
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Clean up the Nuitka-extracted cache folder on version upgrade.
 */
function cleanOldCacheIfNeeded(): void {
  try {
    const cacheDir = serverManager.getCacheDir()
    logger.info(`Computed cache directory: ${cacheDir}`)

    const userDataPath = app.getPath('userData')
    const versionFile = path.join(userDataPath, '.last-version')
    const currentVersion = app.getVersion()

    let previousVersion: string | null = null
    if (fsSync.existsSync(versionFile)) {
      previousVersion = fsSync.readFileSync(versionFile, 'utf8')
    }

    if (previousVersion !== currentVersion) {
      if (fsSync.existsSync(cacheDir)) {
        logger.info(
          `Clearing old cache at ${cacheDir} (upgrading from ${previousVersion} to ${currentVersion})`
        )
        fsSync.rmSync(cacheDir, { recursive: true, force: true })
        logger.info(`Cache cleared at ${cacheDir}`)
      }
      fsSync.writeFileSync(versionFile, currentVersion, 'utf8')
    }
  } catch (error) {
    logger.error('Error during cache cleanup:', error)
  }
}

ipcMain.on('ping', (event, args) => {
  logger.info('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
})

// Listen for the signal from the renderer to start the actual shutdown
ipcMain.on('start-shutdown', () => {
  logger.info('Received start-shutdown signal from renderer. Quitting app.')
  if (shutdownTimer) {
    clearTimeout(shutdownTimer)
    shutdownTimer = null
  }
  app.quit()
})

ipcMain.handle('get-server-status', () => {
  return serverStatusManager.getStatus()
})

ipcMain.handle('restart-server', async () => {
  return await serverStatusManager.restartServer()
})

ipcMain.handle('check-server-health', async () => {
  return await serverStatusManager.checkServerHealth()
})

ipcMain.handle('get-log-file-path', () => {
  return logger.getLogPath()
})

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('clear-app-cache', async () => {
  try {
    await serverManager.stopServer();
  } catch (error) {
    logger.error('Failed to stop server before clearing cache:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
  const cacheDir = serverManager.getCacheDir();
  return clearDirectoryContents(cacheDir);
});

ipcMain.handle('reset-server-data', async () => {
  try {
    await serverManager.stopServer();
  } catch (error) {
    logger.error('Failed to stop server before resetting data:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    await serverManager.resetAppDataDir();
    return { success: true };
  } catch (error) {
    logger.error('Failed to reset app data directory:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('open-log-file', async (event, filePath) => {
  try {
    logger.info(`Attempting to open log file: ${filePath}`)
    if (!fsSync.existsSync(filePath)) {
      logger.error(`Log file does not exist: ${filePath}`)
      return { success: false, error: 'Log file does not exist' }
    }
    await shell.openPath(filePath)
    logger.info(`Log file opened successfully: ${filePath}`)
    return { success: true }
  } catch (error) {
    logger.error(`Failed to open log file: ${error instanceof Error ? error.message : String(error)}`)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error opening log file'
    }
  }
})

ipcMain.handle('open-external-link', async (event, url: string) => {
  try {
    logger.info(`Attempting to open external link: ${url}`);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to open external link: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error opening external link'
    };
  }
});

ipcMain.handle('read-log-file', async (event, filePath) => {
  try {
    logger.info(`Reading log file content: ${filePath}`)
    if (!fsSync.existsSync(filePath)) {
      logger.error(`Log file does not exist: ${filePath}`)
      return { success: false, error: 'Log file does not exist' }
    }
    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.split('\n')
    const lastLines = lines.slice(Math.max(0, lines.length - 500)).join('\n')
    logger.info(`Read ${lastLines.length} characters from log file`)
    return { 
      success: true, 
      content: lastLines,
      filePath: filePath
    }
  } catch (error) {
    logger.error(`Failed to read log file: ${error instanceof Error ? error.message : String(error)}`)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error reading log file'
    }
  }
});

// **NEW** IPC handler for reading local text files securely.
ipcMain.handle('read-local-text-file', async (event, filePath: string) => {
  try {
    logger.info(`Reading local text file: ${filePath}`);
    if (!fsSync.existsSync(filePath)) {
      logger.error(`Local file does not exist: ${filePath}`);
      return { success: false, error: 'File does not exist' };
    }
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    logger.error(`Failed to read local text file ${filePath}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading file'
    };
  }
});

// IPC handler for showing native folder picker dialog
ipcMain.handle('show-folder-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, path: null };
    }
    return { canceled: false, path: result.filePaths[0] };
  } catch (error) {
    logger.error('Failed to show folder dialog:', error);
    return { canceled: true, path: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

app.whenReady()
  .then(async () => {
    logger.info('App is ready, creating window...');
    
    // **NEW** Register a custom protocol to serve local files for media.
    // This allows <video>, <audio>, and <img> tags to load local content securely.
    protocol.handle('local-file', (request) => {
      try {
        const url = new URL(request.url);
        const filePath = path.normalize(decodeURIComponent(url.pathname));
        logger.info(`[local-file protocol] Serving file: ${filePath}`);
        return net.fetch(`file://${filePath}`);
      } catch (error) {
        logger.error(`[local-file protocol] Error handling request ${request.url}:`, error);
        return new Response(null, { status: 404 });
      }
    });

    createWindow();

    // Ensure Nuitka cache is cleaned when the Electron version changes
    cleanOldCacheIfNeeded();

    serverStatusManager.initializeServer().catch(err => {
      logger.error('Server initialization failed in background:', err);
    });
  })
  .catch(err => {
    logger.error('Failed to initialize app:', err);
  });

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q.
  // The 'will-quit' event will handle server shutdown.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Use 'will-quit' to robustly shut down the server.
// This event is fired when the app is about to close.
app.on('will-quit', async (event) => {
  logger.info('App is about to quit. Shutting down server...');
  if (shutdownTimer) {
    clearTimeout(shutdownTimer)
    shutdownTimer = null
  }
  try {
    // Await the server shutdown to ensure it completes before the app exits.
    await serverManager.stopServer();
    logger.info('Server has been shut down successfully.');
  } catch (error) {
    logger.error('Error during server shutdown:', error);
  } finally {
    // Close the logger after all operations are done.
    logger.close();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
