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
  private baseUrl = 'https://api.sarvam.ai';

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
      if (!this.apiKey) {
        throw new Error('Sarvam API key not configured. Please set NEXT_PUBLIC_SARVAM_API_KEY in .env.local');
      }

      console.log('Starting speech-to-text conversion...');
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);
      console.log('API Key present:', !!this.apiKey);
      console.log('API Key first 10 chars:', this.apiKey.substring(0, 10));

      // Create FormData for multipart upload (Sarvam REST API)
      // Determine the correct file extension based on blob type
      let fileExtension = 'wav';
      if (audioBlob.type.includes('webm')) fileExtension = 'webm';
      else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) fileExtension = 'mp3';
      else if (audioBlob.type.includes('ogg')) fileExtension = 'ogg';
      
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${fileExtension}`);
      formData.append('model', 'saaras:v3');
      formData.append('mode', options?.enableTranslation ? 'translate' : 'transcribe');
      formData.append('language_code', this.toSarvamLanguageCode(options?.language));

      console.log('Sending request to:', `${this.baseUrl}/speech-to-text`);
      console.log('Using FormData with audio file');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof Blob ? `Blob(${value.size} bytes, type: ${value.type})` : value);
      }
      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
        },
        body: formData,
      });

      console.log('Sarvam API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sarvam API Error Response:', errorText);
        throw new Error(`Speech-to-Text API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Sarvam API Success:', data);
      
      return {
        transcript: data.transcript || data.transcripts?.[0] || data.result?.transcript || '',
        language: data.language_code,
        confidence: data.confidence ?? data.language_probability,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Speech-to-Text error:', errorMsg);
      throw new Error(`Failed to transcribe audio: ${errorMsg}`);
    }
  }

  private toSarvamLanguageCode(language?: string): string {
    if (!language) return 'unknown';

    const lang = language.toLowerCase();
    const mapping: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      mr: 'mr-IN',
      pa: 'pa-IN',
      or: 'od-IN',
      od: 'od-IN',
      ur: 'ur-IN',
      as: 'as-IN',
      kok: 'kok-IN',
      ks: 'ks-IN',
      sd: 'sd-IN',
      sa: 'sa-IN',
      sat: 'sat-IN',
      mni: 'mni-IN',
      brx: 'brx-IN',
      mai: 'mai-IN',
      doi: 'doi-IN',
    };

    return mapping[lang] || 'unknown';
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
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: errorText,
        });
        throw new Error(`Speech-to-Text API error: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        const base64Audio = data?.audios?.[0];

        if (!base64Audio) {
          throw new Error('Text-to-Speech API error: missing audio in response');
        }

        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const mimeType = this.getAudioMimeType(options?.format || 'wav');
        return new Blob([bytes], { type: mimeType });
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
            'api-subscription-key': this.apiKey,
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

  private getAudioMimeType(format: string): string {
    const key = format.toLowerCase();
    const mimeMap: Record<string, string> = {
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      opus: 'audio/opus',
      flac: 'audio/flac',
      pcm: 'audio/pcm',
      mulaw: 'audio/basic',
      alaw: 'audio/basic',
    };

    return mimeMap[key] || 'audio/wav';
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
   * Translate text to English (for processing regional language input)
   * Uses Google Translate API via free endpoint
   */
  async translateToEnglish(text: string, sourceLang: string): Promise<string> {
    try {
      if (sourceLang === 'en' || sourceLang.startsWith('en-')) {
        return text;
      }

      console.log(`Translating from ${sourceLang} to English:`, text);

      // Use Google Translate API (free, no auth needed)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|en`
      );

      if (!response.ok) {
        console.warn('Translation API failed, returning original text');
        return text;
      }

      const data = await response.json();
      const translated = data?.responseData?.translatedText || text;
      
      console.log('Translation result:', translated);
      return translated;
    } catch (error) {
      console.warn('Translation error:', error);
      return text;
    }
  }

  /**
   * Translate text from English to target language (for regional voice output)
   */
  async translateFromEnglish(text: string, targetLang: string): Promise<string> {
    try {
      if (targetLang === 'en' || targetLang.startsWith('en-')) {
        return text;
      }

      console.log(`Translating from English to ${targetLang}:`, text);

      // Use Google Translate API
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      );

      if (!response.ok) {
        console.warn('Translation API failed, returning original text');
        return text;
      }

      const data = await response.json();
      const translated = data?.responseData?.translatedText || text;
      
      console.log('Translation result:', translated);
      return translated;
    } catch (error) {
      console.warn('Translation error:', error);
      return text;
    }
  }

  /**
   * Normalize language code (e.g., 'hi-IN' to 'hi' for translation APIs)
   */
  private normalizeLanguageCode(langCode: string): string {
    if (!langCode) return 'en';
    return langCode.split('-')[0].toLowerCase();
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
