import { defineStore } from 'pinia';
import type { WebSocketMessage } from '~/types/transcription';
import { useRuntimeConfig } from '#app';

interface TranscriptionState {
  transcription: string;
  error: string | null;
  lastTimestamp: number | null;
  sessionId: string | null;
  isConnected: boolean;
  worker: Worker | null;
}

export const useTranscriptionStore = defineStore('transcription', {
  state: (): TranscriptionState => ({
    transcription: '',
    error: null,
    lastTimestamp: null,
    sessionId: null,
    isConnected: false,
    worker: null
  }),

  actions: {
    initializeWorker() {
      try {
        this.worker = new Worker(new URL('~/workers/transcriptionWorker.ts', import.meta.url), {
          type: 'module'
        });

        this.setupWorkerHandlers();
      } catch (err) {
        console.error('Failed to initialize Web Worker:', err);
        this.error = 'Failed to initialize transcription service';
        throw new Error('Failed to initialize transcription service');
      }
    },

    setupWorkerHandlers() {
      if (!this.worker) return;

      this.worker.onmessage = (event) => {
        const { type, payload } = event.data;
        switch (type) {
          case 'CONNECTED':
            console.log('Worker WebSocket connected.');
            this.isConnected = true;
            this.error = null;
            break;
          case 'DISCONNECTED':
            console.log('Worker WebSocket disconnected.', payload);
            this.isConnected = false;
            break;
          case 'MESSAGE':
            this.handleWorkerMessage(payload);
            break;
          case 'ERROR':
            console.error('Worker error:', payload);
            this.error = payload;
            break;
          default:
            console.warn('Unknown message type from worker:', type);
        }
      };

      this.worker.onerror = (err) => {
        console.error('Worker error:', err);
        this.error = 'Transcription service error';
        this.isConnected = false;
      };
    },

    handleWorkerMessage(message: WebSocketMessage) {
      switch (message.type) {
        case 'transcription':
          this.transcription += message.text + ' ';
          this.lastTimestamp = message.timestamp;
          break;
        case 'warning':
          console.warn('Transcription warning:', message.message);
          this.error = message.message;
          break;
        case 'session_init':
          this.sessionId = message.session_id;
          console.log('Session initialized with ID:', this.sessionId);
          break;
        default:
          console.error('Unknown message type:', message);
      }
    },

    connectWebSocket(workspaceId: string, stepId: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (this.isConnected) {
          resolve();
          return;
        }

        if (!this.worker) {
          try {
            this.initializeWorker();
          } catch (initError) {
            reject(initError);
            return;
          }
        }

        if (!this.worker) {
          reject(new Error('Transcription service is not available'));
          return;
        }

        const config = useRuntimeConfig();
        const transcriptionWsEndpoint = config.public.audio.transcriptionWsEndpoint;
        
        if (!transcriptionWsEndpoint) {
          const errorMsg = 'Transcription service configuration is missing';
          this.error = errorMsg;
          reject(new Error(errorMsg));
          return;
        }

        const handleConnected = (event: MessageEvent) => {
          const { type } = event.data;
          if (type === 'CONNECTED') {
            this.worker?.removeEventListener('message', handleConnected);
            resolve();
          }
        };

        const handleError = (event: MessageEvent) => {
          const { type, payload } = event.data;
          if (type === 'ERROR') {
            this.worker?.removeEventListener('message', handleError);
            reject(new Error(payload));
          }
        };

        this.worker.addEventListener('message', handleConnected);
        this.worker.addEventListener('message', handleError);

        this.worker.postMessage({ 
          type: 'CONNECT', 
          payload: { 
            workspaceId, 
            stepId, 
            transcriptionWsEndpoint 
          } 
        });
      });
    },

    disconnectWebSocket() {
      if (this.worker) {
        this.worker.postMessage({ type: 'DISCONNECT' });
      }
      this.isConnected = false;
    },

    async sendAudioChunk(workspaceId: string, stepId: string, audioChunk: ArrayBuffer) {
      if (!this.worker) {
        this.error = 'Transcription service is not available';
        throw new Error(this.error);
      }

      if (!this.isConnected) {
        this.error = 'WebSocket is not connected';
        throw new Error(this.error);
      }

      try {
        // Send ArrayBuffer directly without converting to Blob
        this.worker.postMessage({ 
          type: 'SEND_AUDIO', 
          payload: { wavData: audioChunk } 
        }, [audioChunk]);

      } catch (err) {
        console.error('Error processing audio chunk:', err);
        this.error = 'Failed to process audio data';
        throw new Error(this.error);
      }
    },

    async finalize(workspaceId: string, stepId: string) {
      this.disconnectWebSocket();
    },

    reset() {
      this.transcription = '';
      this.error = null;
      this.lastTimestamp = null;
      this.sessionId = null;
      this.isConnected = false;
    },

    cleanup() {
      if (this.worker) {
        this.disconnectWebSocket();
        this.worker.terminate();
        this.worker = null;
      }
    }
  }
});