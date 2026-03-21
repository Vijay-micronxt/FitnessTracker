/**
 * ERPNext Service
 * Handles all ERPNext API calls securely from the backend
 * Credentials are never exposed to frontend
 */

import fetch from 'node-fetch';
import { getERPNextConfig, ERPNextQueryOptions, ERPNEXT_READ_OPERATIONS } from '../config/erpnext.config';

interface ERPNextListResponse {
  data: Array<Record<string, any>>;
}

interface ERPNextGetResponse {
  data: Record<string, any>;
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

export class ERPNextService {
  private config = getERPNextConfig();
  private cache: Map<string, CacheEntry> = new Map();
  private requestInProgress: Map<string, Promise<any>> = new Map();

  /**
   * List documents from ERPNext
   * Example: GET /api/resource/Customer?fields=["name","customer_name"]&filters=[["status","=","Active"]]
   */
  async list(
    doctype: string,
    options: ERPNextQueryOptions = {}
  ): Promise<Array<Record<string, any>>> {
    try {
      // Security: Only allow read-only operations
      if (!ERPNEXT_READ_OPERATIONS.includes(doctype)) {
        throw new Error(`Operation not allowed for doctype: ${doctype}`);
      }

      // Check cache first
      const cacheKey = this.getCacheKey('list', doctype, options);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return cachedData;
      }

      // Prevent duplicate concurrent requests
      if (this.requestInProgress.has(cacheKey)) {
        return await this.requestInProgress.get(cacheKey);
      }

      console.log(`[ERPNEXT] Fetching list of ${doctype}...`);

      const promise = this.fetchList(doctype, options);
      this.requestInProgress.set(cacheKey, promise);

      const result = await promise;
      this.requestInProgress.delete(cacheKey);

      // Cache the result
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`[ERROR] Failed to list ${doctype}:`, error);
      throw error;
    }
  }

  /**
   * Get a single document by name/ID
   */
  async get(doctype: string, name: string, fields?: string[]): Promise<Record<string, any>> {
    try {
      if (!ERPNEXT_READ_OPERATIONS.includes(doctype)) {
        throw new Error(`Operation not allowed for doctype: ${doctype}`);
      }

      const cacheKey = this.getCacheKey('get', doctype, { name });
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return cachedData;
      }

      console.log(`[ERPNEXT] Fetching ${doctype}/${name}...`);

      const url = new URL(`${this.config.url}/api/resource/${doctype}/${name}`);
      if (fields && fields.length > 0) {
        url.searchParams.append('fields', JSON.stringify(fields));
      }

      const response = await this.fetchWithRetry(url.toString());
      const result = (response as ERPNextGetResponse).data;

      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`[ERROR] Failed to get ${doctype}/${name}:`, error);
      throw error;
    }
  }

  /**
   * Search documents with filters
   */
  async search(
    doctype: string,
    searchText: string,
    options: ERPNextQueryOptions = {}
  ): Promise<Array<Record<string, any>>> {
    try {
      if (!ERPNEXT_READ_OPERATIONS.includes(doctype)) {
        throw new Error(`Operation not allowed for doctype: ${doctype}`);
      }

      console.log(`[ERPNEXT] Searching ${doctype} for "${searchText}"...`);

      const url = new URL(`${this.config.url}/api/resource/${doctype}`);

      // Build filters for search
      const filters = options.filters || [];
      if (searchText) {
        filters.push(['name', 'like', `%${searchText}%`]);
      }

      if (filters.length > 0) {
        url.searchParams.append('filters', JSON.stringify(filters));
      }

      if (options.fields) {
        url.searchParams.append('fields', JSON.stringify(options.fields));
      }

      if (options.limit) {
        url.searchParams.append('limit_page_length', options.limit.toString());
      }

      const response = await this.fetchWithRetry(url.toString());
      return (response as ERPNextListResponse).data || [];
    } catch (error) {
      console.error(`[ERROR] Failed to search ${doctype}:`, error);
      throw error;
    }
  }

  /**
   * Get count of documents
   */
  async count(doctype: string, filters?: Record<string, any> | Array<any>): Promise<number> {
    try {
      if (!ERPNEXT_READ_OPERATIONS.includes(doctype)) {
        throw new Error(`Operation not allowed for doctype: ${doctype}`);
      }

      const cacheKey = this.getCacheKey('count', doctype, { filters });
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData !== undefined) {
        return cachedData;
      }

      console.log(`[ERPNEXT] Counting ${doctype}...`);

      const url = new URL(`${this.config.url}/api/resource/${doctype}`);
      url.searchParams.append('fields', JSON.stringify(['name']));
      url.searchParams.append('limit_page_length', '1'); // Only get count

      if (filters) {
        url.searchParams.append('filters', JSON.stringify(filters));
      }

      const response = await this.fetchWithRetry(url.toString());
      const count = (response as ERPNextListResponse).data?.length || 0;

      this.setCache(cacheKey, count);

      return count;
    } catch (error) {
      console.error(`[ERROR] Failed to count ${doctype}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for specific key or all
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`[CACHE] Cleared: ${key}`);
    } else {
      this.cache.clear();
      console.log('[CACHE] Cleared all');
    }
  }

  // ============ Private Methods ============

  /**
   * Actual fetch from ERPNext API
   */
  private async fetchList(
    doctype: string,
    options: ERPNextQueryOptions
  ): Promise<Array<Record<string, any>>> {
    const url = new URL(`${this.config.url}/api/resource/${doctype}`);

    // Build query parameters
    if (options.fields && options.fields.length > 0) {
      url.searchParams.append('fields', JSON.stringify(options.fields));
    }

    if (options.filters) {
      url.searchParams.append('filters', JSON.stringify(options.filters));
    }

    if (options.limit) {
      url.searchParams.append('limit_page_length', options.limit.toString());
    }

    if (options.offset) {
      url.searchParams.append('limit_start', options.offset.toString());
    }

    if (options.orderBy) {
      url.searchParams.append('order_by', options.orderBy);
    }

    const response = await this.fetchWithRetry(url.toString());
    return (response as ERPNextListResponse).data || [];
  }

  /**
   * Fetch with retry logic and proper error handling
   */
  private async fetchWithRetry(url: string, retries = 0): Promise<any> {
    try {
      const token = `token ${this.config.apiKey}:${this.config.apiSecret}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout,
      } as any);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (retries < this.config.maxRetries) {
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`[RETRY] Attempt ${retries + 1}/${this.config.maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Cache key generation
   */
  private getCacheKey(operation: string, doctype: string, params: any): string {
    return `erpnext:${operation}:${doctype}:${JSON.stringify(params)}`;
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.cacheTTL * 1000,
    });
  }
}

// Export singleton instance
export const erpnextService = new ERPNextService();
