/**
 * Frontend Configuration Service
 * Fetches feature flags and configuration from the backend /config endpoint
 */

export interface BackendConfig {
  features: {
    voiceInput: boolean;
    voiceOutput: boolean;
    multilingual: boolean;
    supportedLanguages: string[];
  };
  llmProvider?: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: BackendConfig | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<BackendConfig> | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Fetch configuration from backend
   * Caches the result to avoid multiple API calls
   */
  async getConfig(): Promise<BackendConfig> {
    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    // If already loading, return the same promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.fetchConfigFromBackend();

    try {
      this.config = await this.loadPromise;
      return this.config;
    } catch (error) {
      console.error('Failed to fetch backend config:', error);
      // Return default config on error
      return this.getDefaultConfig();
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Fetch config from backend API
   */
  private async fetchConfigFromBackend(): Promise<BackendConfig> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    
    try {
      const response = await fetch(`${apiUrl}/config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Config endpoint returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backend config fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch backend config:', error);
      throw error;
    }
  }

  /**
   * Get default config when backend is unavailable
   */
  private getDefaultConfig(): BackendConfig {
    return {
      features: {
        voiceInput: true,
        voiceOutput: false,
        multilingual: true,
        supportedLanguages: ['en', 'es', 'fr', 'hi', 'ta', 'te'],
      },
      llmProvider: 'claude',
    };
  }

  /**
   * Check if voice input is enabled
   */
  async isVoiceInputEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.features.voiceInput;
  }

  /**
   * Check if voice output is enabled
   */
  async isVoiceOutputEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.features.voiceOutput;
  }

  /**
   * Check if multilingual support is enabled
   */
  async isMultilingualEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.features.multilingual;
  }

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    const config = await this.getConfig();
    return config.features.supportedLanguages;
  }

  /**
   * Clear cached config (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.config = null;
  }
}

export default ConfigService.getInstance();
