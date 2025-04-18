import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { serverManager } from './server/serverManagerFactory'
import { logger } from './logger'
import * as fs from 'fs'
import { ServerStatusManager } from './server/serverStatusManager'

// Create server status manager
const serverStatusManager = new ServerStatusManager(serverManager);

let mainWindow: BrowserWindow | null

/**
 * Create the main application window.
 */
function createWindow() {
  try {
    const cacheDir = path.join((app as any).getPath('cache'), 'autobyteus')
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
        const files = fs.readdirSync(rendererPath)
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
 * Clean up the Nuitka-extracted cache folder on version upgrade.
 */
function cleanOldCacheIfNeeded(): void {
  try {
    // Compute and log cache directory path
    // Cast to any to access the 'cache' path (not yet in TS definitions)
    const cacheDir = path.join((app as any).getPath('cache'), 'autobyteus')
    logger.info(`Computed cache directory: ${cacheDir}`)

    const userDataPath = app.getPath('userData')
    const versionFile = path.join(userDataPath, '.last-version')
    const currentVersion = app.getVersion()

    let previousVersion: string | null = null
    if (fs.existsSync(versionFile)) {
      previousVersion = fs.readFileSync(versionFile, 'utf8')
    }

    if (previousVersion !== currentVersion) {
      if (fs.existsSync(cacheDir)) {
        logger.info(
          `Clearing old cache at ${cacheDir} (upgrading from ${previousVersion} to ${currentVersion})`
        )
        fs.rmSync(cacheDir, { recursive: true, force: true })
        logger.info(`Cache cleared at ${cacheDir}`)
      }
      fs.writeFileSync(versionFile, currentVersion, 'utf8')
    }
  } catch (error) {
    logger.error('Error during cache cleanup:', error)
  }
}

ipcMain.on('ping', (event, args) => {
  logger.info('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
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

ipcMain.handle('open-log-file', async (event, filePath) => {
  try {
    logger.info(`Attempting to open log file: ${filePath}`)
    if (!fs.existsSync(filePath)) {
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
    if (!fs.existsSync(filePath)) {
      logger.error(`Log file does not exist: ${filePath}`)
      return { success: false, error: 'Log file does not exist' }
    }
    const content = fs.readFileSync(filePath, 'utf8')
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

// Modified to stop the server when the client is closed
app.on('window-all-closed', () => {
  logger.info('All windows closed. Stopping server and quitting app.')
  serverManager.stopServer()
  logger.close()
  app.quit()
})

app.on('will-quit', () => {
  logger.close()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
