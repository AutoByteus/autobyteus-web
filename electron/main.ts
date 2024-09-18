// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Recommended to keep false for security
      contextIsolation: true, // Recommended to keep true for security
    },
  })

  const startURL = isDev
    ? process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
    : `file://${path.join(__dirname, '../.nuxt/dist/index.html')}`

  mainWindow.loadURL(startURL)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Handle IPC events here
ipcMain.on('ping', (event, args) => {
  console.log('Received ping:', args)
  event.reply('pong', 'Pong from main process!')
})

app.whenReady().then(createWindow)

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
