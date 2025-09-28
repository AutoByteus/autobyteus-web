// electron/preload.ts

import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendPing: (message: string) => ipcRenderer.send('ping', message),
  onPong: (callback: (response: string) => void) =>
    ipcRenderer.on('pong', (event, response) => callback(response)),

  // Server-related methods
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  onServerStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('server-status', (_, status) => callback(status))
    // Return a function to remove the listener
    return () => ipcRenderer.removeAllListeners('server-status')
  },

  // Method for directly checking server health
  checkServerHealth: () => ipcRenderer.invoke('check-server-health'),

  // Method to get the log file path
  getLogFilePath: () => ipcRenderer.invoke('get-log-file-path'),

  // Method to open the log file
  openLogFile: (filePath: string) => ipcRenderer.invoke('open-log-file', filePath),

  // Method to open an external link
  openExternalLink: (url: string) => ipcRenderer.invoke('open-external-link', url),

  // Method to read log file content
  readLogFile: (filePath: string) => ipcRenderer.invoke('read-log-file', filePath),

  // **NEW** Method to read local text file content
  readLocalTextFile: (filePath: string) => ipcRenderer.invoke('read-local-text-file', filePath),

  // Method to get OS platform
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Shutdown communication
  onAppQuitting: (callback: () => void) => ipcRenderer.on('app-quitting', callback),
  startShutdown: () => ipcRenderer.send('start-shutdown'),

  // Advanced recovery options
  clearAppCache: () => ipcRenderer.invoke('clear-app-cache'),
  resetServerData: () => ipcRenderer.invoke('reset-server-data'),

  // Method for getting file path from a dropped file object
  // In sandboxed renderers, `file.path` is removed. This is the secure way to get the real path.
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
})

// The previous global drop handler has been removed.
// The renderer process will now handle its own drop events on specific elements
// and use the exposed `electronAPI.getPathForFile` function to retrieve file paths.
// This aligns with the new documented pattern and gives components more control.
