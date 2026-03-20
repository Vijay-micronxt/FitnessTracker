/**
 * Domain Configuration Loader
 * Loads domain-specific configuration from environment and JSON files
 * Supports multi-domain setup for whitelabel applications
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { DomainConfig, DEFAULT_CONFIG, BrandingConfig, FeatureFlags, BusinessLogicConfig } from './schema';

/**
 * Load domain configuration from environment and files
 * Priority: Environment variables > Domain JSON file > Default config
 */
export class DomainConfigLoader {
  private domainId: string;
  private configDirectory: string;
  private config: DomainConfig;

  constructor(domainId?: string, configDir?: string) {
    // Get domain from environment variable, parameter, or default
    this.domainId = domainId || process.env.DOMAIN || 'fitness';
    this.configDirectory = configDir || path.join(process.cwd(), 'config', 'domains');
    
    console.log(`[CONFIG] Initializing domain: ${this.domainId}`);
    
    // Load environment variables for this domain
    this.loadDomainEnv();
    
    // Load configuration
    this.config = this.loadConfig();
    
    console.log(`[CONFIG] Domain "${this.domainId}" loaded successfully`);
  }

  /**
   * Load domain-specific .env file
   * Looks for .env.{domain} file
   */
  private loadDomainEnv(): void {
    const envFiles = [
      path.join(process.cwd(), `.env.${this.domainId}`),
      path.join(process.cwd(), `.env.${this.domainId}.local`),
    ];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        console.log(`[CONFIG] Loading environment from: ${envFile}`);
        dotenv.config({ path: envFile });
      }
    }
  }

  /**
   * Load configuration from JSON file or create from environment variables
   */
  private loadConfig(): DomainConfig {
    // Try to load from JSON config file
    const configFile = path.join(this.configDirectory, `${this.domainId}.json`);
    
    if (fs.existsSync(configFile)) {
      console.log(`[CONFIG] Loading domain config from: ${configFile}`);
      const fileContent = fs.readFileSync(configFile, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      return this.mergeConfigs(DEFAULT_CONFIG, fileConfig);
    }

    // Build config from environment variables
    console.log(`[CONFIG] Building config from environment variables`);
    return this.loadConfigFromEnv();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfigFromEnv(): DomainConfig {
    const config: DomainConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Branding
    config.id = this.domainId;
    config.branding.domain = this.domainId;
    config.branding.brandName = process.env.BRAND_NAME || config.branding.brandName;
    config.branding.brandDescription = process.env.BRAND_DESCRIPTION || config.branding.brandDescription;
    config.branding.brandLogo = process.env.BRAND_LOGO || config.branding.brandLogo;
    config.branding.faviconUrl = process.env.FAVICON_URL || config.branding.faviconUrl;

    // Colors
    if (process.env.PRIMARY_COLOR) config.branding.primaryColor = process.env.PRIMARY_COLOR;
    if (process.env.SECONDARY_COLOR) config.branding.secondaryColor = process.env.SECONDARY_COLOR;
    if (process.env.ACCENT_COLOR) config.branding.accentColor = process.env.ACCENT_COLOR;
    if (process.env.TEXT_COLOR) config.branding.textColor = process.env.TEXT_COLOR;
    if (process.env.BG_COLOR) config.branding.backgroundColor = process.env.BG_COLOR;

    // Typography
    if (process.env.FONT_FAMILY) config.branding.fontFamily = process.env.FONT_FAMILY;

    // Data Source
    const dataSourceType = process.env.DATA_SOURCE_TYPE || 'json';
    config.dataSource.type = dataSourceType as 'json' | 'sql' | 'api';

    switch (dataSourceType) {
      case 'json':
        config.dataSource.filePath = process.env.DATA_SOURCE_FILE || config.dataSource.filePath;
        break;
      case 'sql':
        config.dataSource.host = process.env.DB_HOST;
        config.dataSource.port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
        config.dataSource.database = process.env.DB_NAME;
        config.dataSource.username = process.env.DB_USER;
        config.dataSource.password = process.env.DB_PASSWORD;
        break;
      case 'api':
        config.dataSource.endpoint = process.env.API_ENDPOINT;
        config.dataSource.apiKey = process.env.API_KEY;
        break;
    }

    // LLM Configuration
    if (process.env.LLM_PROVIDER) {
      config.llm.provider = process.env.LLM_PROVIDER as 'openai' | 'claude' | 'ollama';
    }
    if (process.env.LLM_MODEL) config.llm.model = process.env.LLM_MODEL;
    if (process.env.LLM_API_KEY) config.llm.apiKey = process.env.LLM_API_KEY;
    if (process.env.LLM_BASE_URL) config.llm.baseUrl = process.env.LLM_BASE_URL;

    // Business Logic
    if (process.env.CURRENCY) config.businessLogic.currency = process.env.CURRENCY;
    if (process.env.MAX_SEARCH_RESULTS) {
      config.businessLogic.maxSearchResults = parseInt(process.env.MAX_SEARCH_RESULTS, 10);
    }
    if (process.env.SUPPORTED_LANGUAGES) {
      config.businessLogic.supportedLanguages = process.env.SUPPORTED_LANGUAGES.split(',');
    }
    if (process.env.DEFAULT_LANGUAGE) {
      config.businessLogic.defaultLanguage = process.env.DEFAULT_LANGUAGE;
    }

    // Environment
    if (process.env.NODE_ENV) {
      config.environment = process.env.NODE_ENV as 'development' | 'staging' | 'production';
    }

    // Logging
    if (process.env.LOG_LEVEL) {
      config.logging.level = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }

    return config;
  }

  /**
   * Deep merge configurations
   */
  private mergeConfigs(defaults: DomainConfig, overrides: Partial<DomainConfig>): DomainConfig {
    const merged = JSON.parse(JSON.stringify(defaults));

    // Recursively merge objects
    const merge = (target: any, source: any) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    };

    merge(merged, overrides);
    return merged;
  }

  /**
   * Get the loaded configuration
   */
  getConfig(): DomainConfig {
    return this.config;
  }

  /**
   * Get specific config section
   */
  getBranding(): BrandingConfig {
    return this.config.branding;
  }

  getFeatures(): FeatureFlags {
    return this.config.features;
  }

  getBusinessLogic(): BusinessLogicConfig {
    return this.config.businessLogic;
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate branding
    if (!this.config.branding.brandName) errors.push('Branding: brandName is required');
    if (!this.config.branding.domain) errors.push('Branding: domain is required');

    // Validate data source
    if (!this.config.dataSource.type) errors.push('DataSource: type is required');
    
    if (this.config.dataSource.type === 'json' && !this.config.dataSource.filePath) {
      errors.push('DataSource: filePath is required for JSON type');
    }
    if (this.config.dataSource.type === 'sql' && !this.config.dataSource.host) {
      errors.push('DataSource: host is required for SQL type');
    }
    if (this.config.dataSource.type === 'api' && !this.config.dataSource.endpoint) {
      errors.push('DataSource: endpoint is required for API type');
    }

    // Validate LLM
    if (!this.config.llm.provider) errors.push('LLM: provider is required');
    if (!this.config.llm.model) errors.push('LLM: model is required');

    // Validate business logic
    if (!this.config.businessLogic.supportedLanguages || this.config.businessLogic.supportedLanguages.length === 0) {
      errors.push('BusinessLogic: supportedLanguages must have at least one language');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Print configuration summary
   */
  printSummary(): void {
    console.log('\n=== DOMAIN CONFIGURATION SUMMARY ===');
    console.log(`Domain ID: ${this.config.id}`);
    console.log(`Brand Name: ${this.config.branding.brandName}`);
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Data Source: ${this.config.dataSource.type}`);
    console.log(`LLM Provider: ${this.config.llm.provider}`);
    console.log(`Supported Languages: ${this.config.businessLogic.supportedLanguages.join(', ')}`);
    console.log(`Voice Features: Input=${this.config.features.voiceInput}, Output=${this.config.features.voiceOutput}`);
    console.log('====================================\n');
  }
}

/**
 * Global singleton instance
 */
let configLoaderInstance: DomainConfigLoader | null = null;

/**
 * Get or create config loader instance
 */
export function getConfigLoader(domainId?: string): DomainConfigLoader {
  if (!configLoaderInstance) {
    configLoaderInstance = new DomainConfigLoader(domainId);
  }
  return configLoaderInstance;
}

/**
 * Get domain configuration
 */
export function getDomainConfig(): DomainConfig {
  return getConfigLoader().getConfig();
}
