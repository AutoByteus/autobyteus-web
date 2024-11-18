class AudioChunkProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { sampleRate, chunkDuration } = options.processorOptions;
    this.sampleRate = sampleRate || 16000; // Use provided sample rate or default to 16000
    this.chunkDuration = chunkDuration || 7; // Use provided chunk duration or default to 7 seconds
    this.chunkSize = this.sampleRate * this.chunkDuration;
    this.buffer = new Float32Array(this.chunkSize);
    this.sampleCount = 0;
  }

  createWavHeader(pcmLength) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF identifier
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    
    // File length
    view.setUint32(4, pcmLength * 2 + 36, true);
    
    // WAVE identifier
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));
    
    // Format chunk identifier
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    
    // Format chunk length
    view.setUint32(16, 16, true);
    
    // Sample format (raw)
    view.setUint16(20, 1, true);
    
    // Channel count
    view.setUint16(22, 1, true);
    
    // Sample rate
    view.setUint32(24, this.sampleRate, true);
    
    // Byte rate
    view.setUint32(28, this.sampleRate * 2, true);
    
    // Block align
    view.setUint16(32, 2, true);
    
    // Bits per sample
    view.setUint16(34, 16, true);
    
    // Data chunk identifier
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    
    // Data chunk length
    view.setUint32(40, pcmLength * 2, true);
    
    return header;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (!input) return true;

    // Resample audio if necessary
    const inputSampleRate = sampleRate;
    const ratio = this.sampleRate / inputSampleRate;
    
    for (let i = 0; i < input.length; i++) {
      const targetIndex = Math.floor(i * ratio);
      if (this.sampleCount < this.chunkSize && targetIndex < this.chunkSize) {
        this.buffer[this.sampleCount++] = input[i];
      }
    }

    // If buffer is full, process and send
    if (this.sampleCount >= this.chunkSize) {
      // Convert Float32Array to 16-bit PCM
      const pcmBuffer = new Int16Array(this.buffer.length);
      for (let i = 0; i < this.buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, this.buffer[i]));
        pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Create WAV header
      const wavHeader = this.createWavHeader(pcmBuffer.length);
      
      // Create WAV data by combining header and PCM
      const wavData = new Uint8Array(wavHeader.byteLength + pcmBuffer.buffer.byteLength);
      wavData.set(new Uint8Array(wavHeader), 0);
      wavData.set(new Uint8Array(pcmBuffer.buffer), wavHeader.byteLength);

      // Send WAV data
      this.port.postMessage({
        type: 'chunk',
        wavData: wavData,
        sampleRate: this.sampleRate
      }, [wavData.buffer]);

      // Create new buffer
      this.buffer = new Float32Array(this.chunkSize);
      this.sampleCount = 0;
    }

    return true;
  }
}

registerProcessor('audio-chunk-processor', AudioChunkProcessor);