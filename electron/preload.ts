// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendPing: (message: string) => ipcRenderer.send('ping', message),
  onPong: (callback: (response: string) => void) => ipcRenderer.on('pong', (event, response) => callback(response)),
})
