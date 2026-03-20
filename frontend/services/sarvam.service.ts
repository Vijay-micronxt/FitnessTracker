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
    
    // If already in full format (e.g., 'ta-IN'), return as-is if valid
    if (lang.includes('-in')) {
      const validCodes = ['en-in', 'hi-in', 'ta-in', 'te-in', 'bn-in', 'gu-in', 'kn-in', 'ml-in', 'mr-in', 'pa-in', 'od-in', 'ur-in', 'as-in', 'kok-in', 'ks-in', 'sd-in', 'sa-in', 'sat-in', 'mni-in', 'brx-in', 'mai-in', 'doi-in'];
      if (validCodes.includes(lang)) {
        // Convert 'ta-in' to 'ta-IN' (lowercase language + uppercase region)
        const parts = lang.split('-');
        return parts[0] + '-' + parts[1].toUpperCase();
      }
    }
    
    // Map short codes to full codes
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
   * Clean markdown formatting artifacts from text before TTS
   * Removes markdown syntax and preserves the actual content
   */
  private cleanTextForTTS(text: string): string {
    // Remove markdown headers (# ## ###)
    text = text.replace(/^#+\s+/gm, '');
    
    // Convert bold/italic formatting to plain text (remove markers, keep content)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');  // **text** → text
    text = text.replace(/\*([^*]+)\*/g, '$1');      // *text* → text
    text = text.replace(/__([^_]+)__/g, '$1');      // __text__ → text
    text = text.replace(/_([^_]+)_/g, '$1');        // _text_ → text
    
    // Remove ': -' pattern that appears between headers and lists, replace with period
    text = text.replace(/:\s*-\s*/g, '. ');
    
    // Remove dash-only lines (empty list markers)
    text = text.replace(/^\s*-\s*$/gm, '');
    
    // Remove bullet points at start of lines but keep the content
    text = text.replace(/^\s*[-•]\s+/gm, '');
    
    // Replace multiple spaces with single space
    text = text.replace(/\s+/g, ' ');
    
    // Remove leading/trailing whitespace and normalize
    text = text.trim();
    
    console.log('Cleaned text preview (first 100 chars):', text.substring(0, 100));
    return text;
  }

  /**
   * Convert text to speech using Bulbul V3
   * Supports 11 Indian languages and 25+ natural voices
   */
  async textToSpeechChunks(
    text: string,
    options?: {
      language?: string;
      voice?: string;
      pace?: number;
      temperature?: number;
      format?: string;
      sampleRate?: number;
    }
  ): Promise<Blob[]> {
    const cleanedText = this.cleanTextForTTS(text);
    console.log('Text cleaned for TTS, original:', text.length, 'cleaned:', cleanedText.length);

    if (cleanedText.length <= 400) {
      const blob = await this.synthesizeChunk(cleanedText, options);
      console.log('Single chunk TTS result, size:', blob.size, 'type:', blob.type);
      return [blob];
    }

    console.log('Splitting into chunks for TTS...');
    const chunks = this.splitIntoChunks(cleanedText, 400); // Use 400 to ensure 500 limit never exceeded
    const audioBlobs: Blob[] = [];
    const failedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`[${i + 1}/${chunks.length}] Synthesizing chunk (${chunk.length} chars): ${chunk.substring(0, 40)}...`);
        const audioBlob = await this.synthesizeChunk(chunk, options);
        console.log(`✅ Chunk ${i + 1} synthesized, size: ${audioBlob.size} bytes`);
        audioBlobs.push(audioBlob);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`❌ Chunk ${i + 1} synthesis failed:`, err);
        failedChunks.push(chunk);
      }
    }

    if (failedChunks.length > 0) {
      console.warn(`⚠️ ${failedChunks.length} out of ${chunks.length} chunks failed to synthesize`);
    } else {
      console.log(`✅ All ${chunks.length} chunks synthesized successfully`);
    }

    if (audioBlobs.length === 0) {
      throw new Error(`Failed to synthesize any audio chunks. All ${chunks.length} chunks failed.`);
    }

    if (audioBlobs.length < chunks.length) {
      const skipped = chunks.length - audioBlobs.length;
      console.warn(`⚠️ Audio will be incomplete: ${skipped} out of ${chunks.length} chunks were skipped`);
    }

    return audioBlobs;
  }

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
      const audioBlobs = await this.textToSpeechChunks(text, options);

      if (audioBlobs.length === 1) {
        console.log('Single blob after processing, returning as is');
        return audioBlobs[0];
      }

      const format = options?.format || 'mp3';
      const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
      const concatenatedBlob = new Blob(audioBlobs, { type: mimeType });
      console.log(`✅ Final audio: ${audioBlobs.length} chunks concatenated, total size: ${concatenatedBlob.size} bytes, type: ${mimeType}`);
      return concatenatedBlob;
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw error;
    }
  }

  /**
   * Synthesize a single chunk of text (respects 500 char TTS API limit)
   * Includes rate limit handling with exponential backoff
   */
  private async synthesizeChunk(
    text: string,
    options?: {
      language?: string;
      voice?: string;
      pace?: number;
      temperature?: number;
      format?: string;
      sampleRate?: number;
    },
    retryCount: number = 0
  ): Promise<Blob> {
    try {
      // Enforce 500 char limit
      if (text.length > 500) {
        throw new Error(`Chunk size ${text.length} exceeds 500 char limit. Split text before sending.`);
      }

      const payload = {
        inputs: [text],
        target_language_code: this.toSarvamLanguageCode(options?.language) || 'en-IN',
        speaker: options?.voice || 'vidya',
        pace: options?.pace || 1.0,
        temperature: options?.temperature || 0.5,
        format: options?.format || 'mp3',
        sample_rate: options?.sampleRate || 16000,
      };

      console.log('Synthesizing chunk:', text.substring(0, 100) + '...');

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
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < 3) {
          const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.warn(`⏳ Rate limited. Retrying in ${delayMs}ms (attempt ${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.synthesizeChunk(text, options, retryCount + 1);
        }

        console.error('API Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200),
        });
        throw new Error(`TTS API error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        
        // Validate response has audio data
        if (data?.error || data?.message?.includes('LIMIT')) {
          throw new Error(`TTS API error: ${data?.error || data?.message}`);
        }

        const base64Audio = data?.audios?.[0];
        if (!base64Audio || typeof base64Audio !== 'string') {
          console.error('Invalid response:', data);
          throw new Error('TTS API returned invalid audio data');
        }

        // Validate base64 looks legitimate (not error text)
        if (base64Audio.includes('QUERY') || base64Audio.includes('LIMIT') || base64Audio.length < 100) {
          throw new Error('TTS API returned error text instead of audio');
        }

        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const mimeType = this.getAudioMimeType(options?.format || 'mp3');
        const blob = new Blob([bytes], { type: mimeType });
        
        // Validate blob size is reasonable for audio
        if (blob.size < 500) {
          throw new Error('Generated audio blob is too small (likely corrupted)');
        }

        return blob;
      }

      return await response.blob();
    } catch (error) {
      console.error('Text-to-Speech chunk error:', error);
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
          speaker: options?.voice || 'vidya',
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
   * Validate response is in expected language (detect language mixing)
   * Warns if response contains significant English or other script mixing
   */
  private validateLanguagePurity(text: string, expectedLang?: string): boolean {
    if (!expectedLang || expectedLang === 'en') return true;

    // Define script ranges for detection
    const scripts: Record<string, { pattern: RegExp; name: string }> = {
      tamil: { pattern: /[\u0B80-\u0BFF]/g, name: 'Tamil' },
      telugu: { pattern: /[\u0C00-\u0C7F]/g, name: 'Telugu' },
      hindi: { pattern: /[\u0900-\u097F]/g, name: 'Hindi' },
      kannada: { pattern: /[\u0C80-\u0CFF]/g, name: 'Kannada' },
      malayalam: { pattern: /[\u0D00-\u0D7F]/g, name: 'Malayalam' },
      english: { pattern: /[A-Za-z]/g, name: 'English' },
    };

    const langScriptMap: Record<string, string[]> = {
      'ta': ['tamil'],
      'ta-IN': ['tamil'],
      'te': ['telugu'],
      'te-IN': ['telugu'],
      'hi': ['hindi'],
      'hi-IN': ['hindi'],
      'kn': ['kannada'],
      'kn-IN': ['kannada'],
      'ml': ['malayalam'],
      'ml-IN': ['malayalam'],
    };

    const expectedScripts = langScriptMap[expectedLang] || [];
    if (expectedScripts.length === 0) return true;

    // Count characters in each script
    const charCounts: Record<string, number> = {};
    for (const [script, config] of Object.entries(scripts)) {
      const matches = text.match(config.pattern);
      charCounts[script] = matches ? matches.length : 0;
    }

    const expectedScript = expectedScripts[0];
    const expectedCount = charCounts[expectedScript] || 0;
    const englishCount = charCounts['english'] || 0;
    const totalChars = text.replace(/[^A-Za-z\u0B80-\u0BFF\u0C00-\u0C7F\u0900-\u097F\u0C80-\u0CFF\u0D00-\u0D7F]/g, '').length;

    if (totalChars === 0) {
      console.warn('⚠️ Response contains no recognized script characters');
      return false;
    }

    const englishPercentage = (englishCount / totalChars) * 100;
    
    if (englishPercentage > 10) {
      console.warn(`⚠️ Language mixing detected: ${englishPercentage.toFixed(1)}% English in ${expectedScripts[0]} response`);
      console.warn(`   Expected ${expectedScripts[0]} chars: ${expectedCount}, English chars: ${englishCount}`);
      return false;
    }

    console.log(`✅ Language purity check passed: ${englishPercentage.toFixed(1)}% English (acceptable)`);
    return true;
  }

  /**
   * Play audio blob in the browser
   * Uses HTML audio element with user-initiated playback
   * CRITICAL: Must be called directly from user gesture (click) to work
   */
  async playAudio(audioBlob: Blob): Promise<void> {
    try {
      console.log('🎵 Preparing audio playback, blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Created audio URL:', audioUrl);
      
      // Create audio element using the same approach as VoiceControls (which works!)
      const audio = new Audio(audioUrl);
      
      console.log('🎵 Audio element created, attempting to play...');
      
      // Setup event handlers
      audio.onended = () => {
        console.log('✅ Audio playback completed');
        try {
          URL.revokeObjectURL(audioUrl);
        } catch (e) {
          console.warn('Error revoking URL:', e);
        }
      };

      audio.onerror = (e) => {
        console.error('❌ Audio error event:', audio.error?.code, audio.error?.message);
        try {
          URL.revokeObjectURL(audioUrl);
        } catch (e) {
          console.warn('Error revoking URL:', e);
        }
        throw new Error(`Audio playback error: ${audio.error?.message || 'Unknown error'}`);
      };

      // Try to play - this must happen immediately after element creation for gesture context to work
      try {
        const playPromise = audio.play();
        
        if (playPromise && typeof playPromise.catch === 'function') {
          // Handle promise rejection if browser supports it
          await playPromise;
          console.log('✅ Audio playback started successfully via promise');
        } else {
          // Older browsers - just assume it plays
          console.log('✅ Audio element created and play() called');
        }
      } catch (playError: any) {
        console.error('❌ Play error caught:', playError?.name, playError?.message);
        
        try {
          URL.revokeObjectURL(audioUrl);
        } catch (e) {
          console.warn('Error revoking URL:', e);
        }
        
        // Re-throw with user-friendly message
        if (playError?.name === 'NotAllowedError') {
          throw new Error('🔊 Browser audio blocked. Check permissions or try different browser.');
        } else if (playError?.name === 'NotSupportedError') {
          throw new Error('Audio format not supported by browser.');
        } else {
          throw playError;
        }
      }
    } catch (error) {
      console.error('❌ Audio playback setup failed:', error);
      throw error;
    }
  }

  async playAudioSequence(audioBlobs: Blob[]): Promise<void> {
    if (audioBlobs.length === 0) {
      throw new Error('No audio chunks available for playback.');
    }

    if (audioBlobs.length === 1) {
      await this.playAudio(audioBlobs[0]);
      return;
    }

    console.log(`🎵 Playing ${audioBlobs.length} audio chunks sequentially`);

    const audio = new Audio();
    const objectUrls = audioBlobs.map(blob => URL.createObjectURL(blob));
    let currentIndex = 0;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        for (const url of objectUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Error revoking URL:', e);
          }
        }
      };

      const playCurrent = async () => {
        try {
          audio.src = objectUrls[currentIndex];
          audio.load();
          await audio.play();
          console.log(`✅ Playback started for chunk ${currentIndex + 1}/${audioBlobs.length}`);
        } catch (error: any) {
          cleanup();
          if (error?.name === 'NotAllowedError') {
            reject(new Error('🔊 Browser blocked audio playback. Audio is ready, but playback must start directly from a user click.'));
          } else {
            reject(error);
          }
        }
      };

      audio.onended = () => {
        currentIndex += 1;
        if (currentIndex >= objectUrls.length) {
          console.log('✅ Sequential audio playback completed');
          cleanup();
          resolve();
          return;
        }

        void playCurrent();
      };

      audio.onerror = () => {
        const error = audio.error;
        cleanup();
        reject(new Error(`Audio playback error: ${error?.message || 'Unknown error'}`));
      };

      void playCurrent();
    });
  }

  /**
   * Translate text from English to target language (for regional voice output)
   * Handles long text by chunking into 500 character segments (API limit)
   */
  async translateFromEnglish(text: string, targetLang: string): Promise<string> {
    try {
      if (targetLang === 'en' || targetLang.startsWith('en-')) {
        return text;
      }

      console.log(`Translating from English to ${targetLang}:`, text.substring(0, 100) + '...');

      // If text is short enough, translate directly
      if (text.length <= 500) {
        return this.translateChunk(text, 'en', targetLang);
      }

      // For longer text, split into sentences and translate in chunks
      console.log(`Text length: ${text.length}, splitting into chunks...`);
      const chunks = this.splitIntoChunks(text, 450); // 450 chars to be safe
      const translatedChunks: string[] = [];

      for (const chunk of chunks) {
        try {
          const translated = await this.translateChunk(chunk, 'en', targetLang);
          translatedChunks.push(translated);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.warn('Chunk translation failed, using original:', err);
          translatedChunks.push(chunk);
        }
      }

      const result = translatedChunks.join('');
      console.log('Full text translation completed');
      return result;
    } catch (error) {
      console.warn('Translation error:', error);
      return text;
    }
  }

  /**
   * Translate text to English (for processing regional language input)
   * Handles long text by chunking into 500 character segments
   */
  async translateToEnglish(text: string, sourceLang: string): Promise<string> {
    try {
      if (sourceLang === 'en' || sourceLang.startsWith('en-')) {
        return text;
      }

      console.log(`Translating from ${sourceLang} to English:`, text.substring(0, 100) + '...');

      // If text is short enough, translate directly
      if (text.length <= 500) {
        return this.translateChunk(text, sourceLang, 'en');
      }

      // For longer text, split and translate in chunks
      console.log(`Text length: ${text.length}, splitting into chunks...`);
      const chunks = this.splitIntoChunks(text, 450);
      const translatedChunks: string[] = [];

      for (const chunk of chunks) {
        try {
          const translated = await this.translateChunk(chunk, sourceLang, 'en');
          translatedChunks.push(translated);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.warn('Chunk translation failed, using original:', err);
          translatedChunks.push(chunk);
        }
      }

      const result = translatedChunks.join('');
      console.log('Full text translation completed');
      return result;
    } catch (error) {
      console.warn('Translation error:', error);
      return text;
    }
  }

  /**
   * Translate a single chunk of text (respects 500 char API limit)
   */
  private async translateChunk(text: string, fromLang: string, toLang: string, retries: number = 3): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );

      // Handle 429 rate limit with retry
      if (response.status === 429) {
        if (retries > 0) {
          const delayMs = Math.pow(2, 4 - retries) * 1000; // 1s, 2s, 4s backoff
          console.warn(`Translation API rate limited, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.translateChunk(text, fromLang, toLang, retries - 1);
        } else {
          console.warn('Translation API rate limited and out of retries, returning original text');
          return text;
        }
      }

      if (!response.ok) {
        console.warn('Translation API failed, returning original text');
        return text;
      }

      const data = await response.json();
      
      // Check for error in response
      if (data?.responseStatus === 400) {
        console.warn('Translation API error:', data?.responseDetails);
        return text;
      }

      const translated = data?.responseData?.translatedText || text;
      console.log('Translation chunk result:', translated.substring(0, 100) + '...');
      return translated;
    } catch (error) {
      console.warn('Translation chunk error:', error);
      return text;
    }
  }

  /**
   * Split text into chunks at sentence/line boundaries
   * Tries to keep chunks under maxChunkSize while preserving integrity
   * Respects word boundaries and script boundaries (Tamil, Hindi, etc.)
   */
  private splitIntoChunks(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    
    // First try to split by double newlines (paragraph breaks)
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // If a single paragraph is larger than max size, split by sentences
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Now handle this paragraph
      if (paragraph.length > maxChunkSize) {
        // Split large paragraph by sentences - support multiple scripts
        // Matches: English periods, Tamil/Devanagari sentence markers, newlines
        const sentenceRegex = /[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g;
        const sentences = paragraph.match(sentenceRegex) || [paragraph];
        
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          if (!trimmedSentence) continue;
          
          // Check if adding this sentence exceeds limit
          if ((currentChunk + trimmedSentence).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedSentence;
          } else {
            currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence;
          }
        }
      } else {
        // Add paragraph to current chunk if it fits
        if ((currentChunk + paragraph).length <= maxChunkSize) {
          currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = paragraph;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Filter out empty chunks and warn if any chunks still exceed limit (shouldn't happen)
    const validChunks = chunks.filter(c => c.trim().length > 0);
    const oversizedChunks = validChunks.filter(c => c.length > maxChunkSize);
    if (oversizedChunks.length > 0) {
      console.warn(`⚠️ ${oversizedChunks.length} chunks exceed max size:`, oversizedChunks.map(c => `${c.length}c`).join(', '));
    }

    console.log(`Split ${text.length} chars into ${validChunks.length} chunks:`, validChunks.map((c, i) => `[${i+1}] ${c.length}c: "${c.substring(0, 40)}..."`).join(' | '));
    return validChunks;
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
