import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { serverManager } from './server/serverManagerFactory'
import { logger } from './logger'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import { ServerStatusManager } from './server/serverStatusManager'

// Create server status manager
const serverStatusManager = new ServerStatusManager(serverManager);

let mainWindow: BrowserWindow | null
let isQuitting = false; // Flag to prevent multiple shutdown attempts

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
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: true,
    })

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

ipcMain.handle('clear-app-cache', async () => {
  const cacheDir = serverManager.getCacheDir();
  return clearDirectoryContents(cacheDir);
});

ipcMain.handle('reset-server-data', async () => {
  const dataDir = serverManager.getAppDataDir();
  return clearDirectoryContents(dataDir);
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
})

app.whenReady()
  .then(async () => {
    logger.info('App is ready, creating window...')
    createWindow()

    // Ensure Nuitka cache is cleaned when the Electron version changes
    cleanOldCacheIfNeeded()

    serverStatusManager.initializeServer().catch(err => {
      logger.error('Server initialization failed in background:', err)
    })
  })
  .catch(err => {
    logger.error('Failed to initialize app:', err)
  })

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q.
  // The 'will-quit' event will handle server shutdown.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Use 'will-quit' to robustly shut down the server.
// This event is fired when the app is about to close.
app.on('will-quit', async (event) => {
  logger.info('App is about to quit. Shutting down server...');
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
    createWindow()
  }
})
