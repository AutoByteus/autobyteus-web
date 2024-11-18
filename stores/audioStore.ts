import { defineStore } from 'pinia';
import { useTranscriptionStore } from '~/stores/transcriptionStore';
import { useRuntimeConfig } from '#app';

interface AudioChunk {
  id: string;
  wavData: Uint8Array;
  sampleRate: number;
  timestamp: number;
  chunkNumber: number;
}

interface AudioStoreState {
  isRecording: boolean;
  error: string | null;
  audioContext: AudioContext | null;
  audioWorklet: AudioWorkletNode | null;
  stream: MediaStream | null;
  audioChunks: AudioChunk[];
  showChunks: boolean;
  chunkCounter: number;
}

export const useAudioStore = defineStore('audio', {
  state: (): AudioStoreState => ({
    isRecording: false,
    error: null,
    audioContext: null,
    audioWorklet: null,
    stream: null,
    audioChunks: [],
    showChunks: false,
    chunkCounter: 1
  }),

  getters: {
    combinedError(): string | null {
      const transcriptionStore = useTranscriptionStore();
      return this.error || transcriptionStore.error;
    }
  },

  actions: {
    getAudioConstraints() {
      const config = useRuntimeConfig();
      return {
        audio: {
          channelCount: config.public.audio.channels,
          sampleRate: config.public.audio.sampleRate,
          ...config.public.audio.constraints
        }
      };
    },

    toggleChunksVisibility() {
      this.showChunks = !this.showChunks;
    },

    async downloadChunk(chunkId: string) {
      const chunk = this.audioChunks.find(c => c.id === chunkId);
      if (chunk) {
        const wavBlob = new Blob([chunk.wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chunk_${chunk.chunkNumber}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },

    deleteChunk(chunkId: string) {
      this.audioChunks = this.audioChunks.filter(chunk => chunk.id !== chunkId);
    },

    clearAllChunks() {
      this.audioChunks = [];
      this.chunkCounter = 1;
    },

    async startRecording(workspaceId: string, stepId: string): Promise<void> {
      try {
        this.error = null;

        const transcriptionStore = useTranscriptionStore();
        await transcriptionStore.connectWebSocket(workspaceId, stepId);

        this.stream = await navigator.mediaDevices.getUserMedia(this.getAudioConstraints());
        
        const config = useRuntimeConfig();
        const sampleRate = config.public.audio.sampleRate;
        
        this.audioContext = new AudioContext({
          sampleRate: sampleRate,
          latencyHint: 'interactive'
        });

        await this.audioContext.audioWorklet.addModule(new URL('@/workers/audio-processor.worklet.js', import.meta.url));
        
        const source = this.audioContext.createMediaStreamSource(this.stream);
        
        const chunkDuration = config.public.audio.chunkDuration;
        
        this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-chunk-processor', {
          processorOptions: {
            sampleRate: sampleRate,
            chunkDuration: chunkDuration
          }
        });

        this.audioWorklet.port.onmessage = async (event) => {
          if (event.data.type === 'chunk') {
            const chunk: AudioChunk = {
              id: crypto.randomUUID(),
              wavData: new Uint8Array(event.data.wavData),
              sampleRate: event.data.sampleRate,
              timestamp: Date.now(),
              chunkNumber: this.chunkCounter++
            };

            this.audioChunks.push(chunk);
            await transcriptionStore.sendAudioChunk(workspaceId, stepId, chunk.wavData.buffer);
          }
        };

        source.connect(this.audioWorklet);
        this.audioWorklet.connect(this.audioContext.destination);
        
        this.isRecording = true;

      } catch (err: any) {
        this.error = err.message;
        console.error('Recording start error:', err);
        await this.stopRecording(workspaceId, stepId);
        throw err;
      }
    },

    async stopRecording(workspaceId: string, stepId: string): Promise<void> {
      try {
        if (this.audioWorklet) {
          this.audioWorklet.disconnect();
          this.audioWorklet = null;
        }

        if (this.audioContext) {
          await this.audioContext.close();
          this.audioContext = null;
        }

        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        this.isRecording = false;

        const transcriptionStore = useTranscriptionStore();
        await transcriptionStore.finalize(workspaceId, stepId);

      } catch (err: any) {
        this.error = err.message;
        console.error('Recording stop error:', err);
        throw err;
      }
    },

    async cleanup(workspaceId: string | null = null, stepId: string | null = null): Promise<void> {
      if (this.isRecording && workspaceId && stepId) {
        await this.stopRecording(workspaceId, stepId);
      }
      this.clearAllChunks();
    }
  }
});