import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudioStore } from '~/stores/audioStore'
import { useTranscriptionStore } from '~/stores/transcriptionStore'

describe('audioStore', () => {
  let audioStore: ReturnType<typeof useAudioStore>
  let transcriptionStore: ReturnType<typeof useTranscriptionStore>

  // Mock MediaRecorder
  class MockMediaRecorder {
    state = 'inactive'
    ondataavailable: ((event: any) => void) | null = null
    onerror: ((event: any) => void) | null = null
    
    static isTypeSupported(mimeType: string) {
      return mimeType === 'audio/wav';
    }
    
    constructor(stream: MediaStream, options: MediaRecorderOptions) {
      if (options.mimeType !== 'audio/wav') {
        throw new Error('Unsupported MIME type');
      }
    }
    
    start(timeslice?: number) {
      this.state = 'recording'
      // Simulate chunk generation
      if (this.ondataavailable) {
        setTimeout(() => {
          this.ondataavailable({
            data: new Blob(['test-audio'], { type: 'audio/wav' })
          });
        }, 100);
      }
    }
    
    stop() {
      this.state = 'inactive'
    }
  }

  beforeEach(() => {
    // Reset mocks
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockResolvedValue(new MediaStream())

    audioStore = useAudioStore()
    transcriptionStore = useTranscriptionStore()
  })

  describe('initialization', () => {
    it('should start with default values', () => {
      expect(audioStore.isRecording).toBe(false)
      expect(audioStore.combinedError).toBeNull()
    })
  })

  describe('startRecording', () => {
    it('should initialize recording with WAV format', async () => {
      await audioStore.startRecording('workspace-1', 'step-1')
      
      expect(audioStore.isRecording).toBe(true)
      expect(audioStore.combinedError).toBeNull()
    })

    it('should handle unsupported WAV format', async () => {
      // Mock MediaRecorder to not support WAV
      vi.spyOn(MockMediaRecorder, 'isTypeSupported')
        .mockReturnValueOnce(false)

      await expect(
        audioStore.startRecording('workspace-1', 'step-1')
      ).rejects.toThrow('WAV recording is not supported')
      
      expect(audioStore.isRecording).toBe(false)
    })

    it('should handle microphone permission denial', async () => {
      vi.spyOn(navigator.mediaDevices, 'getUserMedia')
        .mockRejectedValueOnce(new Error('Permission denied'))

      await expect(
        audioStore.startRecording('workspace-1', 'step-1')
      ).rejects.toThrow('Permission denied')
      
      expect(audioStore.isRecording).toBe(false)
      expect(audioStore.combinedError).toBe('Permission denied')
    })
  })

  describe('stopRecording', () => {
    it('should stop recording and cleanup resources', async () => {
      await audioStore.startRecording('workspace-1', 'step-1')
      expect(audioStore.isRecording).toBe(true)

      await audioStore.stopRecording('workspace-1', 'step-1')
      expect(audioStore.isRecording).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should cleanup resources when recording', async () => {
      await audioStore.startRecording('workspace-1', 'step-1')
      await audioStore.cleanup('workspace-1', 'step-1')
      
      expect(audioStore.isRecording).toBe(false)
    })

    it('should do nothing when not recording', async () => {
      await audioStore.cleanup('workspace-1', 'step-1')
      expect(audioStore.isRecording).toBe(false)
    })
  })
})