import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { serverManager } from './server/serverManagerFactory'
import { logger } from './logger'
import axios from 'axios'
import * as fs from 'fs'

// Determine if we should use the internal server
const useInternalServer = process.env.USE_INTERNAL_SERVER !== 'false'

let mainWindow: BrowserWindow | null
let serverStartFailed = false
let serverStarting = true // Track when server is in startup phase

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
      // Always show the window immediately - we won't block the UI anymore
      show: true, 
    })

    const startURL = isDev
      ? process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
      : `file://${path.join(__dirname, '../renderer/index.html')}`

    logger.info('Environment:', isDev ? 'Development' : 'Production')
    logger.info('Loading URL:', startURL)
    logger.info('Using internal server:', useInternalServer)
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
        const fs = require('fs')
        const files = fs.readdirSync(rendererPath)
        logger.info('Files in renderer directory:', files)
      } catch (error) {
        logger.error('Error listing renderer directory:', error)
      }

      if (!mainWindow) return
      
      if (useInternalServer) {
        // For internal server, notify renderer of current status
        if (serverStartFailed) {
          mainWindow.webContents.send('server-status', { status: 'error', message: 'Failed to start backend server' })
        } else if (serverManager.isRunning()) {
          const serverUrls = serverManager.getServerUrls()
          mainWindow.webContents.send('server-status', { 
            status: 'running', 
            port: serverManager.getServerPort(),
            urls: serverUrls
          })
        } else {
          // If server is still starting, send 'starting' status
          mainWindow.webContents.send('server-status', { status: 'starting' })
        }
      } else {
        // For external server, we don't manage server status in the main process
        logger.info('Using external server - renderer will handle server connection')
      }
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  } catch (error) {
    logger.error('Error in createWindow:', error)
  }
}

// Initialize and start the backend server
async function initializeServer() {
  // Skip server initialization if using external server
  if (!useInternalServer) {
    logger.info('Using external server - skipping internal server initialization')
    serverStarting = false
    return
  }
  
  try {
    logger.info('Starting backend server...')
    await serverManager.startServer()
    
    // Server successfully started
    serverStarting = false
    
    // Notify the window the server is ready, but don't wait for this to show the window
    if (mainWindow) {
      const serverUrls = serverManager.getServerUrls()
      mainWindow.webContents.send('server-status', { 
        status: 'running', 
        port: serverManager.getServerPort(),
        urls: serverUrls
      })
    }
    
    logger.info('Backend server started successfully on port', serverManager.getServerPort())
  } catch (error) {
    logger.error('Failed to start backend server:', error)
    serverStartFailed = true
    serverStarting = false
    
    // Notify window of error if it exists, but don't prevent app from loading
    if (mainWindow) {
      mainWindow.webContents.send('server-status', { 
        status: 'error', 
        message: 'Failed to start backend server' 
      })
    }
  }
}

// Handle IPC messages from the renderer process
ipcMain.on('ping', (event, args) => {
  logger.info('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
})

// Handle get-server-status request
ipcMain.handle('get-server-status', () => {
  if (!useInternalServer) {
    // When using external server, don't try to provide status
    return { status: 'starting' }
  }
  
  if (serverStartFailed) {
    return { status: 'error', message: 'Failed to start backend server' }
  }
  
  if (!serverManager.isRunning()) {
    return { status: 'starting' }
  }
  
  return {
    status: 'running',
    port: serverManager.getServerPort(),
    urls: serverManager.getServerUrls()
  }
})

// Handle restart-server request
ipcMain.handle('restart-server', async () => {
  if (!useInternalServer) {
    // Can't restart external server
    return { status: 'error', message: 'Cannot restart external server' }
  }
  
  try {
    serverStarting = true
    serverManager.stopServer()
    await serverManager.startServer()
    serverStarting = false
    return { 
      status: 'running', 
      port: serverManager.getServerPort(),
      urls: serverManager.getServerUrls()
    }
  } catch (error) {
    serverStarting = false
    logger.error('Failed to restart server:', error)
    return { status: 'error', message: 'Failed to restart server' }
  }
})

// Handler for directly checking server health with improved error handling
ipcMain.handle('check-server-health', async () => {
  if (!useInternalServer) {
    // For external server, let the renderer handle health checks
    return { status: 'error', message: 'Health check should be handled by renderer for external server' }
  }
  
  try {
    const healthUrl = `${serverManager.getServerBaseUrl()}/rest/health`
    logger.info(`Checking server health at: ${healthUrl}`)
    
    const response = await axios.get(healthUrl, { timeout: 3000 }) // 3 second timeout
    
    return {
      status: response.status === 200 ? 'ok' : 'error',
      data: response.data
    }
  } catch (error) {
    // During server startup, connection refused errors are expected
    if (serverStarting) {
      logger.info('Health check during startup: Server not ready yet')
      return {
        status: 'starting',
        message: 'Server is still starting up'
      }
    }
    
    // For unexpected errors or after server should be running, log more details
    let errorMessage = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error instanceof Object && 'code' in error) {
        errorCode = error.code as string;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    logger.error(`Health check failed: ${errorCode} - ${errorMessage}`);
    
    return {
      status: 'error',
      message: serverStarting ? 
        'Server is still starting up' : 
        'Failed to connect to server health endpoint'
    }
  }
})

// Handler to get the log file path
ipcMain.handle('get-log-file-path', () => {
  return logger.getLogPath()
})

// New handler to open the log file
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

app.whenReady()
  .then(async () => {
    logger.info('App is ready, creating window...')
    // Always create window immediately, regardless of server status
    createWindow()
    
    // Start the backend server (only if using internal server) in the background
    initializeServer().catch(err => {
      logger.error('Server initialization failed in background:', err)
      // App UI is already showing, so we just need to update the status
      if (mainWindow) {
        mainWindow.webContents.send('server-status', { 
          status: 'error', 
          message: `Failed to start backend server: ${err.message || err}` 
        })
      }
    })
  })
  .catch(err => {
    logger.error('Failed to initialize app:', err)
  })

app.on('window-all-closed', () => {
  // Don't stop the server when the app is closed to allow for faster startup next time
  // This is commented out to keep server running
  // if (useInternalServer) {
  //   serverManager.stopServer()
  // }
  
  // Close the logger
  logger.close()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Don't stop the server when the app quits to allow for faster startup next time
  // This is commented out to keep server running
  // if (useInternalServer) {
  //   serverManager.stopServer()
  // }
  
  // Close the logger
  logger.close()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
