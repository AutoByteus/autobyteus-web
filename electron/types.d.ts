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
    openLogFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    openExternalLink: (url: string) => Promise<{ success: boolean; error?: string }>;
    readLogFile: (filePath: string) => Promise<{ success: boolean; error?: string, content?: string }>;
    onAppQuitting: (callback: () => void) => void;
    startShutdown: () => void;
    clearAppCache: () => Promise<{ success: boolean; error?: string }>;
    resetServerData: () => Promise<{ success: boolean; error?: string }>;
  };
}
