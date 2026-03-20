/**
 * Frontend Configuration Service
 * Fetches and caches domain configuration from backend
 * Provides centralized access to branding, features, and business logic
 */

import { FrontendDomainConfig, DEFAULT_FRONTEND_CONFIG } from '../config/schema';

class ConfigService {
  private config: FrontendDomainConfig | null = null;
  private loading: boolean = false;
  private loadPromise: Promise<FrontendDomainConfig> | null = null;
  private apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Initialize config service and fetch configuration from backend
   */
  async initialize(): Promise<FrontendDomainConfig> {
    // Return cached config if already loaded
    if (this.config) {
      console.log('[CONFIG] Using cached configuration');
      return this.config;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      console.log('[CONFIG] Configuration already loading, waiting...');
      return this.loadPromise;
    }

    // Start loading
    this.loadPromise = this.loadConfiguration();
    return this.loadPromise;
  }

  /**
   * Fetch configuration from backend /api/config endpoint
   */
  private async loadConfiguration(): Promise<FrontendDomainConfig> {
    try {
      this.loading = true;
      console.log('[CONFIG] Fetching configuration from', this.apiBaseUrl);

      const response = await fetch(`${this.apiBaseUrl}/api/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.config = this.normalizeConfig(data);

      console.log('[CONFIG] Configuration loaded successfully');
      console.log('[CONFIG] Domain:', this.config.domain);
      console.log('[CONFIG] Brand:', this.config.branding.brandName);
      console.log('[CONFIG] Features:', Object.keys(this.config.features).filter(k => this.config!.features[k as keyof typeof this.config.features]));

      return this.config;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[CONFIG] Failed to load configuration:', errorMsg);
      console.warn('[CONFIG] Using default configuration as fallback');

      // Use default config as fallback
      this.config = JSON.parse(JSON.stringify(DEFAULT_FRONTEND_CONFIG));
      return this.config;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Normalize and validate configuration from backend
   */
  private normalizeConfig(data: any): FrontendDomainConfig {
    // Ensure all required fields exist with defaults
    return {
      domain: data.domain || DEFAULT_FRONTEND_CONFIG.domain,
      branding: {
        ...DEFAULT_FRONTEND_CONFIG.branding,
        ...data.branding,
      },
      features: {
        ...DEFAULT_FRONTEND_CONFIG.features,
        ...data.features,
      },
      businessLogic: {
        ...DEFAULT_FRONTEND_CONFIG.businessLogic,
        ...data.businessLogic,
      },
      environment: data.environment || DEFAULT_FRONTEND_CONFIG.environment,
    };
  }

  /**
   * Get the current configuration
   * Note: Call initialize() first to ensure config is loaded
   */
  getConfig(): FrontendDomainConfig {
    if (!this.config) {
      console.warn('[CONFIG] Configuration not loaded yet, returning defaults');
      return DEFAULT_FRONTEND_CONFIG;
    }
    return this.config;
  }

  /**
   * Get branding configuration
   */
  getBranding() {
    return this.getConfig().branding;
  }

  /**
   * Get feature flags
   */
  getFeatures() {
    return this.getConfig().features;
  }

  /**
   * Get business logic configuration
   */
  getBusinessLogic() {
    return this.getConfig().businessLogic;
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof typeof DEFAULT_FRONTEND_CONFIG.features): boolean {
    return this.getConfig().features[feature] === true;
  }

  /**
   * Get a specific branding value
   */
  getBrandingValue<K extends keyof typeof DEFAULT_FRONTEND_CONFIG.branding>(
    key: K
  ): (typeof DEFAULT_FRONTEND_CONFIG.branding)[K] {
    return this.getConfig().branding[key];
  }

  /**
   * Check if loading is in progress
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get domain ID
   */
  getDomain(): string {
    return this.getConfig().domain;
  }

  /**
   * Print configuration summary
   */
  printSummary(): void {
    const config = this.getConfig();
    console.log('\n=== FRONTEND CONFIGURATION SUMMARY ===');
    console.log('Domain:', config.domain);
    console.log('Brand Name:', config.branding.brandName);
    console.log('Environment:', config.environment);
    console.log('Primary Color:', config.branding.primaryColor);
    console.log('Supported Languages:', config.businessLogic.supportedLanguages.join(', '));
    console.log('Features Enabled:', 
      Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(', ')
    );
    console.log('=======================================\n');
  }
}

/**
 * Global singleton instance
 */
let configServiceInstance: ConfigService | null = null;

/**
 * Get or create config service instance
 */
export function getConfigService(): ConfigService {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
}

/**
 * Initialize config service (call this in app root)
 */
export async function initializeConfig(): Promise<FrontendDomainConfig> {
  return getConfigService().initialize();
}

export default ConfigService;
