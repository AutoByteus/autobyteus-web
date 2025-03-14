// Define the global TypeScript interface for the Electron API
interface Window {
  electronAPI?: {
    sendPing: (message: string) => void;
    onPong: (callback: (response: string) => void) => void;
    getServerStatus: () => Promise<any>;
    restartServer: () => Promise<any>;
    onServerStatus: (callback: (status: any) => void) => () => void;
    checkServerHealth: () => Promise<any>;
    getLogFilePath: () => Promise<string>;
  };
}
