/**
 * Simple in-memory cache for LLM responses
 * Reduces API calls for duplicate questions
 */

interface CacheEntry {
  response: string;
  citedArticles: any[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 3600000; // 1 hour default

  /**
   * Generate cache key from message
   */
  private generateKey(message: string): string {
    return message.toLowerCase().trim();
  }

  /**
   * Get cached response
   */
  get(message: string): { response: string; citedArticles: any[] } | null {
    const key = this.generateKey(message);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return {
      response: entry.response,
      citedArticles: entry.citedArticles,
    };
  }

  /**
   * Set cached response
   */
  set(
    message: string,
    response: string,
    citedArticles: any[],
    ttl: number = this.defaultTTL
  ): void {
    const key = this.generateKey(message);
    this.cache.set(key, {
      response,
      citedArticles,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService();
