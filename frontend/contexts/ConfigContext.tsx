/**
 * Domain Configuration Context
 * Provides global access to domain configuration throughout the app
 * Handles async config loading and provides fallback defaults
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FrontendDomainConfig, DEFAULT_FRONTEND_CONFIG } from '../config/schema';
import { getConfigService, initializeConfig } from '../services/config.service';

interface ConfigContextType {
  config: FrontendDomainConfig | null;
  loading: boolean;
  error: string | null;
  isFeatureEnabled: (feature: string) => boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

/**
 * Config Provider Component
 * Wrap your app with this to provide config to all components
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FrontendDomainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[CONFIG PROVIDER] Initializing configuration...');
        const loadedConfig = await initializeConfig();
        setConfig(loadedConfig);
        setError(null);
        console.log('[CONFIG PROVIDER] Configuration loaded:', loadedConfig.domain);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[CONFIG PROVIDER] Failed to load config:', errorMsg);
        setError(errorMsg);
        // Use defaults as fallback
        setConfig(DEFAULT_FRONTEND_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const contextValue: ConfigContextType = {
    config: config || DEFAULT_FRONTEND_CONFIG,
    loading,
    error,
    isFeatureEnabled: (feature: string): boolean => {
      if (!config) return DEFAULT_FRONTEND_CONFIG.features[feature as keyof typeof DEFAULT_FRONTEND_CONFIG.features] ?? false;
      return config.features[feature as keyof typeof config.features] ?? false;
    },
  };

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
}

/**
 * Hook to use domain configuration
 * Usage: const { config, loading } = useDomainConfig();
 */
export function useDomainConfig(): ConfigContextType {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useDomainConfig must be used within ConfigProvider');
  }
  return context;
}

/**
 * Hook to get branding configuration
 * Usage: const branding = useBranding();
 */
export function useBranding() {
  const { config } = useDomainConfig();
  return config.branding;
}

/**
 * Hook to get feature flags
 * Usage: const features = useFeatures();
 */
export function useFeatures() {
  const { config } = useDomainConfig();
  return config.features;
}

/**
 * Hook to get business logic configuration
 * Usage: const businessLogic = useBusinessLogic();
 */
export function useBusinessLogic() {
  const { config } = useDomainConfig();
  return config.businessLogic;
}

/**
 * Hook to check if a specific feature is enabled
 * Usage: const voiceEnabled = useFeatureEnabled('voiceInput');
 */
export function useFeatureEnabled(
  feature: keyof typeof DEFAULT_FRONTEND_CONFIG.features
): boolean {
  const { config } = useDomainConfig();
  return config.features[feature] === true;
}

/**
 * Hook to get domain ID
 * Usage: const domain = useDomain();
 */
export function useDomain(): string {
  const { config } = useDomainConfig();
  return config.domain;
}

/**
 * Hook to get specific branding value
 * Usage: const primaryColor = useBrandingValue('primaryColor');
 */
export function useBrandingValue<T extends keyof typeof DEFAULT_FRONTEND_CONFIG.branding>(
  key: T
): (typeof DEFAULT_FRONTEND_CONFIG.branding)[T] {
  const branding = useBranding();
  return branding[key];
}

export default ConfigContext;
