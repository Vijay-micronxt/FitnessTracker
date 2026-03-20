/**
 * Data Source Manager Service
 * Factory and manager for creating and managing data source adapters
 */

import {
  DataSourceConfig,
  DataSourceType,
  DataItem,
  DataSourceResponse,
  QueryOptions,
  DomainDataSources,
} from '@/config/datasource.schema';

import {
  IDataSourceAdapter,
  JSONDataSourceAdapter,
  RESTAPIDataSourceAdapter,
  GraphQLDataSourceAdapter,
} from './datasource.adapter';

/**
 * Singleton Data Source Manager
 * Manages all data source adapters and routing
 */
export class DataSourceManager {
  private static instance: DataSourceManager;
  private adapters: Map<string, IDataSourceAdapter> = new Map();
  private domainDataSources: Record<string, DomainDataSources> = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  /**
   * Factory method to create appropriate adapter
   */
  private createAdapter(config: DataSourceConfig): IDataSourceAdapter {
    switch (config.type) {
      case DataSourceType.JSON:
        return new JSONDataSourceAdapter();

      case DataSourceType.REST_API:
        return new RESTAPIDataSourceAdapter();

      case DataSourceType.GRAPHQL:
        return new GraphQLDataSourceAdapter();

      case DataSourceType.SQL:
        throw new Error('SQL adapter must run on backend');

      default:
        const _exhaustive: never = config;
        throw new Error(`Unknown data source type: ${_exhaustive}`);
    }
  }

  /**
   * Register data sources for a domain
   */
  async registerDomain(
    domain: string,
    dataSources: DomainDataSources
  ): Promise<void> {
    console.log(`[DataSourceManager] Registering domain: ${domain}`);

    for (const [collection, config] of Object.entries(dataSources)) {
      const key = `${domain}:${collection}`;

      try {
        const adapter = this.createAdapter(config);
        await adapter.init(config);
        this.adapters.set(key, adapter);
        console.log(`[DataSourceManager] Registered ${key} (${config.type})`);
      } catch (error) {
        console.error(`[DataSourceManager] Failed to register ${key}:`, error);
        throw error;
      }
    }

    this.domainDataSources[domain] = dataSources;
  }

  /**
   * Get adapter for collection
   */
  private getAdapter(domain: string, collection: string): IDataSourceAdapter {
    const key = `${domain}:${collection}`;
    const adapter = this.adapters.get(key);

    if (!adapter) {
      throw new Error(`No adapter found for ${key}`);
    }

    return adapter;
  }

  /**
   * List all items from collection
   */
  async list(
    domain: string,
    collection: string,
    options?: QueryOptions
  ): Promise<DataSourceResponse> {
    const adapter = this.getAdapter(domain, collection);
    return adapter.list(options);
  }

  /**
   * Get single item by ID
   */
  async getById(
    domain: string,
    collection: string,
    id: string
  ): Promise<DataItem | null> {
    const adapter = this.getAdapter(domain, collection);
    return adapter.getById(id);
  }

  /**
   * Search collection
   */
  async search(
    domain: string,
    collection: string,
    query: string,
    options?: QueryOptions
  ): Promise<DataSourceResponse> {
    const adapter = this.getAdapter(domain, collection);
    return adapter.search(query, options);
  }

  /**
   * Create new item
   */
  async create(
    domain: string,
    collection: string,
    data: Partial<DataItem>
  ): Promise<DataItem> {
    const adapter = this.getAdapter(domain, collection);

    if (!adapter.create) {
      throw new Error(`Create not supported for ${domain}:${collection}`);
    }

    return adapter.create(data);
  }

  /**
   * Update existing item
   */
  async update(
    domain: string,
    collection: string,
    id: string,
    data: Partial<DataItem>
  ): Promise<DataItem> {
    const adapter = this.getAdapter(domain, collection);

    if (!adapter.update) {
      throw new Error(`Update not supported for ${domain}:${collection}`);
    }

    return adapter.update(id, data);
  }

  /**
   * Delete item
   */
  async delete(
    domain: string,
    collection: string,
    id: string
  ): Promise<boolean> {
    const adapter = this.getAdapter(domain, collection);

    if (!adapter.delete) {
      throw new Error(`Delete not supported for ${domain}:${collection}`);
    }

    return adapter.delete(id);
  }

  /**
   * Get available collections for domain
   */
  getCollections(domain: string): string[] {
    const dataSources = this.domainDataSources[domain];
    return dataSources ? Object.keys(dataSources) : [];
  }

  /**
   * Clear cache for collection
   */
  clearCache(domain: string, collection: string): void {
    // Adapters with cache can implement clear
    // For now, this is a placeholder for future enhancement
    console.log(`[DataSourceManager] Cache cleared for ${domain}:${collection}`);
  }

  /**
   * Disconnect all adapters
   */
  async disconnect(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      if (adapter.disconnect) {
        await adapter.disconnect();
      }
    }
    this.adapters.clear();
    console.log('[DataSourceManager] All adapters disconnected');
  }
}

/**
 * Export singleton getter
 */
export function getDataSourceManager(): DataSourceManager {
  return DataSourceManager.getInstance();
}
