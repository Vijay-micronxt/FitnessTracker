import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env';

/**
 * Redis-based caching service
 */
export class CacheService {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    this.client = createClient({ url: config.redisUrl });
    if (this.client) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.client) return;
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  /**
   * Generate hash key for query
   */
  generateQueryKey(query: string): string {
    return `query:${Buffer.from(query).toString('base64')}`;
  }

  /**
   * Generate hash key for embedding
   */
  generateEmbeddingKey(embedding: number[]): string {
    const hash = embedding.slice(0, 10).join('_');
    return `embedding:${hash}`;
  }

  /**
   * Generate hash key for LLM response
   */
  generateResponseKey(query: string, intent: string): string {
    const combined = `${query}:${intent}`;
    return `response:${Buffer.from(combined).toString('base64')}`;
  }
}
