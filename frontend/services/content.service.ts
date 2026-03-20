/**
 * Content/Text Resource Loader
 * Loads content files based on domain and language
 * Supports fallback to default language if translation is missing
 */

import { DomainContent, FitnessContent, Language } from '../config/content.schema';

type ContentMap = Record<string, Record<string, any>>;

/**
 * Content Manager
 * Handles loading, caching, and fallback for content resources
 */
class ContentManager {
  private contentCache: ContentMap = {};
  private domain: string = 'fitness';
  private language: string = 'en';
  private fallbackLanguage: string = 'en';
  private contentBaseUrl: string = '/content';

  constructor(domain: string = 'fitness', language: string = 'en', fallbackLanguage: string = 'en') {
    this.domain = domain;
    this.language = language;
    this.fallbackLanguage = fallbackLanguage;
    console.log(`[CONTENT] Initializing ContentManager for domain: ${domain}, language: ${language}`);
  }

  /**
   * Load content for current domain and language
   */
  async loadContent(): Promise<DomainContent> {
    const cacheKey = `${this.domain}_${this.language}`;

    // Return cached content if available
    if (this.contentCache[cacheKey]) {
      console.log(`[CONTENT] Using cached content for ${cacheKey}`);
      return this.contentCache[cacheKey] as DomainContent;
    }

    try {
      // Try to load domain+language specific content
      console.log(`[CONTENT] Loading: ${this.domain}.${this.language}.json`);
      const content = await this.loadContentFile(`${this.domain}.${this.language}`);
      this.contentCache[cacheKey] = content;
      return content;
    } catch (error) {
      console.warn(`[CONTENT] Failed to load domain-language content, trying fallback language`);

      if (this.language !== this.fallbackLanguage) {
        try {
          // Try fallback language
          const fallbackKey = `${this.domain}_${this.fallbackLanguage}`;
          if (!this.contentCache[fallbackKey]) {
            console.log(`[CONTENT] Loading fallback: ${this.domain}.${this.fallbackLanguage}.json`);
            const fallbackContent = await this.loadContentFile(`${this.domain}.${this.fallbackLanguage}`);
            this.contentCache[fallbackKey] = fallbackContent;
          }
          return this.contentCache[fallbackKey] as DomainContent;
        } catch (fallbackError) {
          console.error('[CONTENT] Failed to load content:', fallbackError);
          throw new Error(`Failed to load content for ${this.domain}`);
        }
      }

      throw error;
    }
  }

  /**
   * Load a specific content file
   */
  private async loadContentFile(filePrefix: string): Promise<DomainContent> {
    try {
      const response = await fetch(`${this.contentBaseUrl}/${filePrefix}.json`);

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[CONTENT] Loaded content file: ${filePrefix}`);
      return data as DomainContent;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[CONTENT] Error loading ${filePrefix}.json:`, errorMsg);
      throw error;
    }
  }

  /**
   * Get content value by path
   * Example: getContentValue('appName') → returns app name text
   * Example: getContentValue('buttons.submit') → returns submit button text
   */
  getContentValue(path: string, content: DomainContent): string {
    const keys = path.split('.');
    let current: any = content;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`[CONTENT] Path not found: ${path}`);
        return path; // Return path as fallback
      }
    }

    return typeof current === 'string' ? current : path;
  }

  /**
   * Set language (for language switching)
   */
  setLanguage(language: string): void {
    this.language = language;
    console.log(`[CONTENT] Language changed to: ${language}`);
    // Clear cache for this domain
    const oldCacheKey = `${this.domain}_*`;
    Object.keys(this.contentCache).forEach((key) => {
      if (key.startsWith(`${this.domain}_`)) {
        delete this.contentCache[key];
      }
    });
  }

  /**
   * Set domain (for domain switching)
   */
  setDomain(domain: string): void {
    this.domain = domain;
    console.log(`[CONTENT] Domain changed to: ${domain}`);
    // Clear all cache on domain change
    this.contentCache = {};
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return this.language;
  }

  /**
   * Get current domain
   */
  getDomain(): string {
    return this.domain;
  }

  /**
   * Check if content is loaded
   */
  isLoaded(cacheKey: string): boolean {
    return cacheKey in this.contentCache;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.contentCache = {};
    console.log('[CONTENT] Cache cleared');
  }

  /**
   * Print content summary
   */
  printSummary(content: DomainContent): void {
    console.log('\n=== CONTENT LOADED ===');
    console.log('Domain:', this.domain);
    console.log('Language:', this.language);
    console.log('App Name:', content.appName);
    console.log('Total keys:', Object.keys(content).length);
    console.log('=====================\n');
  }
}

/**
 * Global singleton instance
 */
let contentManagerInstance: ContentManager | null = null;

/**
 * Get or create content manager instance
 */
export function getContentManager(
  domain?: string,
  language?: string,
  fallbackLanguage?: string
): ContentManager {
  if (!contentManagerInstance) {
    contentManagerInstance = new ContentManager(domain, language, fallbackLanguage);
  }
  return contentManagerInstance;
}

/**
 * Initialize content manager with configuration
 */
export async function initializeContent(
  domain: string,
  language: string,
  fallbackLanguage: string = 'en'
): Promise<DomainContent> {
  const manager = getContentManager(domain, language, fallbackLanguage);
  const content = await manager.loadContent();
  manager.printSummary(content);
  return content;
}

export default ContentManager;
