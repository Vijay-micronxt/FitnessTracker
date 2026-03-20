/**
 * Frontend Configuration Schema
 * Client-side configuration matching backend DomainConfig
 * Subset of backend config (excludes sensitive data like API keys)
 */

export interface FrontendBrandingConfig {
  domain: string;
  brandName: string;
  brandDescription: string;
  brandLogo: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: {
    small: string;
    base: string;
    large: string;
    xlarge: string;
  };
}

export interface FrontendFeatureFlags {
  voiceInput: boolean;
  voiceOutput: boolean;
  videoSupport: boolean;
  socialSharing: boolean;
  userAccounts: boolean;
  offlineMode: boolean;
  analyticsTracking: boolean;
  multiLanguageSupport: boolean;
  [key: string]: boolean;
}

export interface FrontendBusinessLogicConfig {
  currency: string;
  supportedLanguages: string[];
  defaultLanguage: string;
}

export interface FrontendDomainConfig {
  domain: string;
  branding: FrontendBrandingConfig;
  features: FrontendFeatureFlags;
  businessLogic: FrontendBusinessLogicConfig;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Default frontend configuration (used while loading from API)
 */
export const DEFAULT_FRONTEND_CONFIG: FrontendDomainConfig = {
  domain: 'fitness',
  branding: {
    domain: 'fitness',
    brandName: 'Fitness Tracker',
    brandDescription: 'Your personal fitness companion',
    brandLogo: '/assets/fitness/logo.png',
    faviconUrl: '/assets/fitness/favicon.ico',
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
    supportedLanguages: ['en', 'es', 'fr'],
    defaultLanguage: 'en',
  },
  environment: 'development',
};
