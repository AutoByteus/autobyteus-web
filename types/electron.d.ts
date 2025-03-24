export {}
declare global {
  interface Window {
    electronAPI: {
      sendPing: (message: string) => void;
      onPong: (callback: (response: string) => void) => void;
      getServerStatus: () => Promise<{        status: 'starting' | 'running' | 'error';
        port: number;
        urls: Record<string, string>;
        message?: string;
        isExternalServerDetected?: boolean;
      }>;
      restartServer: () => Promise<{        status: 'starting' | 'running' | 'error';
        port: number;
        urls: Record<string, string>;
        message?: string;
        isExternalServerDetected?: boolean;
      }>;
      onServerStatus: (callback: (status: {
        status: 'starting' | 'running' | 'error';
        port: number;
        urls: Record<string, string>;
        message?: string;
        isExternalServerDetected?: boolean;
      }) => void) => () => void;
      checkServerHealth: () => Promise<{        status: 'ok' | 'error';
        data?: any;
        message?: string;
        isExternalServerDetected?: boolean;
      }>;
      // New methods for log file operations
      getLogFilePath: () => Promise<string>;
      openLogFile: (filePath: string) => Promise<{        success: boolean;
        error?: string;
      }>;
      readLogFile: (filePath: string) => Promise<{        success: boolean;
        content?: string;
        filePath?: string;
        error?: string;
      }>;
    };
  }
}
