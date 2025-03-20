// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendPing: (message: string) => ipcRenderer.send('ping', message),
  onPong: (callback: (response: string) => void) => ipcRenderer.on('pong', (event, response) => callback(response)),
  
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
  
  // New method to open the log file
  openLogFile: (filePath: string) => ipcRenderer.invoke('open-log-file', filePath)
})
