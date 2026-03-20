/**
 * Configuration Schema for Whitelabel Multi-Domain Application
 * Defines all configurable properties for different domains
 */

export interface BrandingConfig {
  // Brand Identity
  domain: string;
  brandName: string;
  brandDescription: string;
  brandLogo: string; // Path to logo image
  faviconUrl: string;
  
  // Theming
  primaryColor: string; // Hex color
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: {
    small: string;
    base: string;
    large: string;
    xlarge: string;
  };
}

export interface DataSourceConfig {
  type: 'json' | 'sql' | 'api';
  
  // For JSON files
  filePath?: string;
  
  // For SQL databases
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  
  // For REST APIs
  endpoint?: string;
  apiKey?: string;
  requestHeaders?: Record<string, string>;
}

export interface LLMConfig {
  provider: 'openai' | 'claude' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptTemplate?: string; // Template with {domain} placeholder
}

export interface FeatureFlags {
  voiceInput: boolean;
  voiceOutput: boolean;
  videoSupport: boolean;
  socialSharing: boolean;
  userAccounts: boolean;
  offlineMode: boolean;
  analyticsTracking: boolean;
  multiLanguageSupport: boolean;
  
  // Domain-specific features
  [key: string]: boolean;
}

export interface BusinessLogicConfig {
  // Application behavior
  currency: string;
  maxSearchResults: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
  
  // Voice/Audio
  supportedLanguages: string[];
  defaultLanguage: string;
  voiceSampleRate?: number;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Content
  contentCategories: string[];
  resultsPerPage: number;
}

export interface DomainConfig {
  // Metadata
  id: string;
  name: string;
  description: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Branding
  branding: BrandingConfig;
  
  // Data Source
  dataSource: DataSourceConfig;
  
  // LLM Configuration
  llm: LLMConfig;
  
  // Feature Flags
  features: FeatureFlags;
  
  // Business Logic
  businessLogic: BusinessLogicConfig;
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelayMs: number;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    enableFileLogging: boolean;
    logDirectory?: string;
  };
}

/**
 * Default configuration template
 * Used as fallback when domain-specific config is incomplete
 */
export const DEFAULT_CONFIG: DomainConfig = {
  id: 'default',
  name: 'Default Domain',
  description: 'Default configuration template',
  version: '1.0.0',
  environment: 'development',
  
  branding: {
    domain: 'default',
    brandName: 'Fitness Tracker',
    brandDescription: 'Your personal fitness companion',
    brandLogo: '/assets/default/logo.png',
    faviconUrl: '/assets/default/favicon.ico',
    primaryColor: '#ff6b35',
    secondaryColor: '#004e89',
    accentColor: '#f7b801',
    textColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      small: '12px',
      base: '16px',
      large: '20px',
      xlarge: '32px',
    },
  },
  
  dataSource: {
    type: 'json',
    filePath: '/data/default_guides.json',
  },
  
  llm: {
    provider: 'claude',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 1024,
    systemPromptTemplate: 'You are a helpful assistant for the {domain} domain.',
  },
  
  features: {
    voiceInput: true,
    voiceOutput: true,
    videoSupport: false,
    socialSharing: false,
    userAccounts: false,
    offlineMode: false,
    analyticsTracking: true,
    multiLanguageSupport: true,
  },
  
  businessLogic: {
    currency: 'USD',
    maxSearchResults: 5,
    cacheEnabled: true,
    cacheTtlSeconds: 3600,
    supportedLanguages: ['en', 'es', 'fr'],
    defaultLanguage: 'en',
    voiceSampleRate: 16000,
    rateLimitWindowMs: 3600000,
    rateLimitMaxRequests: 30,
    contentCategories: ['General'],
    resultsPerPage: 10,
  },
  
  api: {
    baseUrl: 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  
  logging: {
    level: 'info',
    format: 'text',
    enableFileLogging: false,
  },
};
