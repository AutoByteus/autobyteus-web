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

function createWindow() {
  try {
    logger.info('Creating main window')
    
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      // Always show the window immediately
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

    // Uncomment for debugging
    // mainWindow.webContents.openDevTools()

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
      // List files in the renderer directory for debugging
      const rendererPath = path.join(__dirname, '../renderer')
      logger.info('Renderer directory:', rendererPath)
      try {
        const files = fs.readdirSync(rendererPath)
        logger.info('Files in renderer directory:', files)
      } catch (error) {
        logger.error('Error listing renderer directory:', error)
      }

      if (!mainWindow) return
      
      // Send current server status to renderer
      mainWindow.webContents.send('server-status', serverStatusManager.getStatus())
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })
    
    // Listen for status changes from server status manager
    serverStatusManager.on('status-change', (status) => {
      if (mainWindow) {
        mainWindow.webContents.send('server-status', status)
      }
    })
    
  } catch (error) {
    logger.error('Error in createWindow:', error)
  }
}

// Handle IPC messages from the renderer process
ipcMain.on('ping', (event, args) => {
  logger.info('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
})

// Handle get-server-status request - delegate to status manager
ipcMain.handle('get-server-status', () => {
  return serverStatusManager.getStatus();
})

// Handle restart-server request - delegate to status manager
ipcMain.handle('restart-server', async () => {
  return await serverStatusManager.restartServer();
})

// Handler for directly checking server health - delegate to status manager
ipcMain.handle('check-server-health', async () => {
  return await serverStatusManager.checkServerHealth();
})

// Handler to get the log file path
ipcMain.handle('get-log-file-path', () => {
  return logger.getLogPath()
})

// Handler to open the log file
ipcMain.handle('open-log-file', async (event, filePath) => {
  try {
    logger.info(`Attempting to open log file: ${filePath}`)
    
    // Verify that the file exists before attempting to open it
    if (!fs.existsSync(filePath)) {
      logger.error(`Log file does not exist: ${filePath}`)
      return { success: false, error: 'Log file does not exist' }
    }
    
    // Open the file with the default system application
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

// New handler to read log file content
ipcMain.handle('read-log-file', async (event, filePath) => {
  try {
    logger.info(`Reading log file content: ${filePath}`)
    
    // Verify that the file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`Log file does not exist: ${filePath}`)
      return { success: false, error: 'Log file does not exist' }
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Get only the last 500 lines to avoid sending too much data
    const lines = content.split('\n');
    const lastLines = lines.slice(Math.max(0, lines.length - 500)).join('\n');
    
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
    // Always create window immediately
    createWindow()
    
    // Start server initialization in the background
    serverStatusManager.initializeServer().catch(err => {
      logger.error('Server initialization failed in background:', err)
    })
  })
  .catch(err => {
    logger.error('Failed to initialize app:', err)
  })

app.on('window-all-closed', () => {
  // Don't stop the server when the app is closed to allow for faster startup next time
  // Close the logger
  logger.close()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Don't stop the server when the app quits to allow for faster startup next time
  // Close the logger
  logger.close()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
