import { defineStore } from 'pinia';

interface TranscriptionState {
  transcription: string | null;
  isTranscribing: boolean;
  error: string | null;
}

export const useTranscriptionStore = defineStore('transcription', {
  state: (): TranscriptionState => ({
    transcription: null,
    isTranscribing: false,
    error: null,
  }),

  actions: {
    $reset() {
      this.transcription = null;
      this.isTranscribing = false;
      this.error = null;
    },

    async transcribeAudio(blob: Blob) {
      this.isTranscribing = true;
      this.error = null;
      this.transcription = null; // Reset transcription before starting new one

      try {
        const audioContent = await this.blobToBase64(blob);
        const config = useRuntimeConfig();
        
        const response = await fetch(
          `https://speech.googleapis.com/v1/speech:recognize?key=${config.public.googleSpeechApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
              },
              audio: {
                content: audioContent,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          this.transcription = data.results
            .map((result: any) => result.alternatives[0].transcript)
            .join('\n');
        } else {
          this.error = 'No transcription result found.';
        }
      } catch (error) {
        this.error = `Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('Transcription error:', error);
      } finally {
        this.isTranscribing = false;
      }
    },

    blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
          } else {
            reject(new Error('Failed to convert blob to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
  },
});