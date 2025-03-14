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
      }>;
      restartServer: () => Promise<{        status: 'starting' | 'running' | 'error';
        port: number;
        urls: Record<string, string>;
        message?: string;
      }>;
      onServerStatus: (callback: (status: {
        status: 'starting' | 'running' | 'error';
        port: number;
        urls: Record<string, string>;
        message?: string;
      }) => void) => () => void;
      checkServerHealth: () => Promise<{        status: 'ok' | 'error';
        data?: any;
        message?: string;
      }>;
    };
  }
}
