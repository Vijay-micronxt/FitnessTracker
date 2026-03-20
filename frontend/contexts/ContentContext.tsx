/**
 * Content Context
 * Provides access to localized content throughout the app
 * Must be used inside ConfigProvider
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DomainContent } from '../config/content.schema';
import { getContentManager, initializeContent } from '../services/content.service';
import { useDomain, useDomainConfig } from './ConfigContext';

interface ContentContextType {
  content: DomainContent | null;
  loading: boolean;
  error: string | null;
  t: (key: string, fallback?: string) => string;
  changeLanguage: (language: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

/**
 * Content Provider Component
 * Loads content based on domain and language from config
 */
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const { config, loading: configLoading } = useDomainConfig();
  const [content, setContent] = useState<DomainContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    if (configLoading || !config) {
      return;
    }

    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const domain = config.domain;
        const language = currentLanguage;
        const fallbackLanguage = config.businessLogic.defaultLanguage;

        console.log(`[CONTENT PROVIDER] Loading content for domain: ${domain}, language: ${language}`);

        const loadedContent = await initializeContent(domain, language, fallbackLanguage);
        setContent(loadedContent);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[CONTENT PROVIDER] Failed to load content:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [config, configLoading, currentLanguage]);

  const t = (key: string, fallback?: string): string => {
    if (!content) {
      return fallback || key;
    }

    const manager = getContentManager();
    try {
      return manager.getContentValue(key, content);
    } catch (err) {
      console.warn(`[CONTENT] Translation missing for key: ${key}`);
      return fallback || key;
    }
  };

  const changeLanguage = async (language: string): Promise<void> => {
    console.log(`[CONTENT PROVIDER] Changing language to: ${language}`);
    setCurrentLanguage(language);
  };

  const contextValue: ContentContextType = {
    content: content || ({} as DomainContent),
    loading: loading || configLoading,
    error,
    t,
    changeLanguage,
  };

  return <ContentContext.Provider value={contextValue}>{children}</ContentContext.Provider>;
}

/**
 * Hook to use content
 */
export function useContent(): ContentContextType {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
}

/**
 * Hook to translate a key (shorter version of useContent().t)
 */
export function useTranslation() {
  const { t, changeLanguage } = useContent();
  return {
    t,
    changeLanguage,
  };
}

/**
 * Hook to get all content
 */
export function useContentData(): DomainContent {
  const { content } = useContent();
  return content || ({} as DomainContent);
}

export default ContentContext;
