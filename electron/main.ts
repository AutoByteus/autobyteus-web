import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'

let mainWindow: BrowserWindow | null

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    const startURL = isDev
      ? process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
      : `file://${path.join(__dirname, '../renderer/index.html')}`

    console.log('Environment:', isDev ? 'Development' : 'Production')
    console.log('Loading URL:', startURL)
    console.log('Current directory:', __dirname)
    console.log('Resolved index.html path:', path.resolve(__dirname, '../renderer/index.html'))
    
    mainWindow.loadURL(startURL)
      .then(() => {
        console.log('URL loaded successfully')
      })
      .catch(err => {
        console.error('Failed to load URL:', startURL, err)
      })

    mainWindow.webContents.openDevTools()

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Page failed to load:', {
        errorCode,
        errorDescription,
        validatedURL,
        startURL
      })
    })

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page finished loading')
      // List files in the renderer directory for debugging
      const rendererPath = path.join(__dirname, '../renderer')
      console.log('Renderer directory:', rendererPath)
      try {
        const fs = require('fs')
        const files = fs.readdirSync(rendererPath)
        console.log('Files in renderer directory:', files)
      } catch (error) {
        console.error('Error listing renderer directory:', error)
      }
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  } catch (error) {
    console.error('Error in createWindow:', error)
  }
}

ipcMain.on('ping', (event, args) => {
  console.log('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
})

app.whenReady()
  .then(() => {
    console.log('App is ready, creating window...')
    createWindow()
  })
  .catch(err => {
    console.error('Failed to initialize app:', err)
  })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})