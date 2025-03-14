import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { serverManager } from './server/serverManagerFactory'
import { logger } from './logger'
import axios from 'axios'

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
      // Don't show the window until server is ready or when using external server
      show: !useInternalServer, // Show immediately if using external server
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
        // For internal server, handle server status
        if (serverStartFailed) {
          mainWindow.webContents.send('server-status', { status: 'error', message: 'Failed to start backend server' })
          if (!mainWindow.isVisible()) mainWindow.show()
        } else if (serverManager.isRunning()) {
          // If server is already running, show the window immediately but still send the 'starting' status first
          // followed by 'running' status after a short delay to ensure loading screen appears
          mainWindow.webContents.send('server-status', { status: 'starting' })
          setTimeout(() => {
            if (mainWindow) {
              const serverUrls = serverManager.getServerUrls()
              mainWindow.webContents.send('server-status', { 
                status: 'running', 
                port: serverManager.getServerPort(),
                urls: serverUrls
              })
            }
          }, 1500) // Wait 1.5 seconds before sending 'running' status
          
          // Show window now, the loading overlay will be visible until status changes to 'running'
          if (!mainWindow.isVisible()) mainWindow.show()
        } else {
          // If server is still starting, send 'starting' status and wait for server ready event
          mainWindow.webContents.send('server-status', { status: 'starting' })
          // Show window now with 'starting' status
          if (!mainWindow.isVisible()) mainWindow.show()
        }
      } else {
        // For external server, we don't manage server status in the main process
        // The renderer will handle connecting to the external server
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
    
    // Instead of showing window here, now we just notify the window the server is ready
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
    
    // Notify window of error if it exists
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

// New handler for directly checking server health with improved error handling
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
    // Don't log the full stack trace for these expected errors
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
    
    // Check if error is an Error object
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for axios error or any error with a code property
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

// New handler to get the log file path
ipcMain.handle('get-log-file-path', () => {
  return logger.getLogPath()
})

app.whenReady()
  .then(async () => {
    logger.info('App is ready, creating window...')
    createWindow()
    
    // Start the backend server (only if using internal server)
    await initializeServer()
  })
  .catch(err => {
    logger.error('Failed to initialize app:', err)
  })

app.on('window-all-closed', () => {
  // Stop the server when the app is closed (only if using internal server)
  if (useInternalServer) {
    serverManager.stopServer()
  }
  
  // Close the logger
  logger.close()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Ensure server is stopped when app is quitting (only if using internal server)
  if (useInternalServer) {
    serverManager.stopServer()
  }
  
  // Close the logger
  logger.close()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
