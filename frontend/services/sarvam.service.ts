// Sarvam AI Voice Service
// Handles both Speech-to-Text (Saaras V3) and Text-to-Speech (Bulbul V3)

interface SarvamSpeechToTextResponse {
  transcript: string;
  language?: string;
  confidence?: number;
}

interface SarvamTextToSpeechResponse {
  audioUrl?: string;
  audio?: ArrayBuffer;
}

export class SarvamVoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_SARVAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Sarvam API key not configured. Voice features may not work.');
    }
  }

  /**
   * Convert audio file/blob to text using Saaras V3
   * Supports 22 Indian languages with automatic detection
   */
  async speechToText(
    audioBlob: Blob,
    options?: {
      language?: string; // e.g., 'hi', 'en', 'ta', 'te'
      enableFormatting?: boolean;
      enableTranslation?: boolean;
    }
  ): Promise<SarvamSpeechToTextResponse> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      
      if (options?.language) {
        formData.append('language_code', options.language);
      }

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Speech-to-Text API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        transcript: data.transcript || '',
        language: data.language_code,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Bulbul V3
   * Supports 11 Indian languages and 25+ natural voices
   */
  async textToSpeech(
    text: string,
    options?: {
      language?: string; // e.g., 'hi', 'en', 'ta'
      voice?: string; // e.g., 'Shubh', 'Shreya', 'Manan'
      pace?: number; // 0.5 to 2.0 (default: 1.0)
      temperature?: number; // 0.01 to 1.0 (default: 0.5)
      format?: string; // 'mp3', 'wav', 'aac' (default: 'mp3')
      sampleRate?: number; // 8000, 16000, 22050, 24000 (default: 16000)
    }
  ): Promise<Blob> {
    try {
      const payload = {
        inputs: [text],
        target_language_code: options?.language || 'en',
        speaker: options?.voice || 'Shubh',
        pace: options?.pace || 1.0,
        temperature: options?.temperature || 0.5,
        format: options?.format || 'wav',
        sample_rate: options?.sampleRate || 16000,
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Text-to-Speech API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw error;
    }
  }

  /**
   * Stream text-to-speech for real-time voice output
   * Returns an event source for streaming audio
   */
  streamTextToSpeech(
    text: string,
    options?: {
      language?: string;
      voice?: string;
      pace?: number;
      temperature?: number;
    },
    onChunk?: (chunk: Uint8Array) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const payload = {
          inputs: [text],
          target_language_code: options?.language || 'en',
          speaker: options?.voice || 'Shubh',
          pace: options?.pace || 1.0,
          temperature: options?.temperature || 0.5,
          format: 'wav',
          sample_rate: 16000,
        };

        const response = await fetch(`${this.baseUrl}/text-to-speech:stream`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Streaming TTS error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          if (onChunk && value) {
            onChunk(value);
          }
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Play audio blob in the browser
   */
  playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Record audio from microphone using Web Audio API
   */
  async recordAudio(durationMs: number = 10000): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          stream.getTracks().forEach((track) => track.stop());
          resolve(audioBlob);
        };

        mediaRecorder.onerror = (error) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(error);
        };

        mediaRecorder.start();

        // Auto-stop after duration
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, durationMs);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default SarvamVoiceService;
