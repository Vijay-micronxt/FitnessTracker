/**
 * Data Source Adapter Interface
 * Defines the contract that all data source adapters must implement
 */

import {
  DataSourceConfig,
  DataItem,
  DataSourceResponse,
  QueryOptions,
  DataSourceType,
  JSONDataSourceConfig,
  RESTAPIDataSourceConfig,
  SQLDataSourceConfig,
  GraphQLDataSourceConfig,
} from '@/config/datasource.schema';

/**
 * Base interface for all data source adapters
 * Each adapter (JSON, SQL, REST API, GraphQL) implements this interface
 */
export interface IDataSourceAdapter {
  /**
   * Initialize the adapter with configuration
   */
  init(config: DataSourceConfig): Promise<void>;

  /**
   * List all items from data source
   */
  list(options?: QueryOptions): Promise<DataSourceResponse>;

  /**
   * Get single item by ID
   */
  getById(id: string): Promise<DataItem | null>;

  /**
   * Search items
   */
  search(query: string, options?: QueryOptions): Promise<DataSourceResponse>;

  /**
   * Create new item
   */
  create?(data: Partial<DataItem>): Promise<DataItem>;

  /**
   * Update existing item
   */
  update?(id: string, data: Partial<DataItem>): Promise<DataItem>;

  /**
   * Delete item
   */
  delete?(id: string): Promise<boolean>;

  /**
   * Disconnect/cleanup
   */
  disconnect?(): Promise<void>;
}

/**
 * JSON File Data Source Adapter
 * Reads data from static JSON files (e.g., /public/data/guides.json)
 */
export class JSONDataSourceAdapter implements IDataSourceAdapter {
  private config!: JSONDataSourceConfig;
  private data: DataItem[] = [];
  private cache: Record<string, DataItem[]> = {};

  async init(config: DataSourceConfig): Promise<void> {
    if (config.type !== DataSourceType.JSON) {
      throw new Error('Invalid config type for JSONDataSourceAdapter');
    }

    this.config = config as JSONDataSourceConfig;
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch(this.config.filePath);
      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${response.statusText}`);
      }

      const fileData = await response.json();
      this.data = Array.isArray(fileData) ? fileData : [fileData];
      console.log(`[JSON] Loaded ${this.data.length} items from ${this.config.filePath}`);
    } catch (error) {
      console.error(`[JSON] Error loading data:`, error);
      this.data = [];
    }
  }

  async list(options?: QueryOptions): Promise<DataSourceResponse> {
    let items = [...this.data];

    // Apply filters
    if (options?.filter) {
      items = items.filter((item) => {
        for (const [key, value] of Object.entries(options.filter!)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    }

    // Apply search
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(
        (item) =>
          (item.title?.toLowerCase().includes(searchLower) || false) ||
          (item.description?.toLowerCase().includes(searchLower) || false) ||
          (item.content?.toLowerCase().includes(searchLower) || false)
      );
    }

    // Apply sorting
    if (options?.sort) {
      items.sort((a, b) => {
        const aVal = a[options.sort!.field];
        const bVal = b[options.sort!.field];
        const order = options.sort!.order === 'asc' ? 1 : -1;
        return aVal > bVal ? order : aVal < bVal ? -order : 0;
      });
    }

    // Apply pagination
    const total = items.length;
    if (options?.pagination) {
      const { page, limit } = options.pagination;
      const start = (page - 1) * limit;
      items = items.slice(start, start + limit);
    }

    return {
      data: items,
      total,
      page: options?.pagination?.page,
      limit: options?.pagination?.limit,
      hasMore:
        options?.pagination ?
          (options.pagination.page * options.pagination.limit) < total
          : false,
    };
  }

  async getById(id: string): Promise<DataItem | null> {
    return this.data.find((item) => item.id === id) || null;
  }

  async search(query: string, options?: QueryOptions): Promise<DataSourceResponse> {
    return this.list({ ...options, search: query });
  }

  // JSON files are typically read-only
  async create(): Promise<DataItem> {
    throw new Error('JSON data source does not support create');
  }

  async update(): Promise<DataItem> {
    throw new Error('JSON data source does not support update');
  }

  async delete(): Promise<boolean> {
    throw new Error('JSON data source does not support delete');
  }
}

/**
 * REST API Data Source Adapter
 * Fetches data from REST API endpoints
 */
export class RESTAPIDataSourceAdapter implements IDataSourceAdapter {
  private config!: RESTAPIDataSourceConfig;
  private cache: Map<string, { data: DataSourceResponse; timestamp: number }> = new Map();

  async init(config: DataSourceConfig): Promise<void> {
    if (config.type !== DataSourceType.REST_API) {
      throw new Error('Invalid config type for RESTAPIDataSourceAdapter');
    }

    this.config = config as RESTAPIDataSourceConfig;
    console.log(`[REST API] Initialized with base URL: ${this.config.baseUrl}`);
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.headers || {}),
    };

    if (this.config.authentication) {
      if (this.config.authentication.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.config.authentication.credentials}`;
      } else if (this.config.authentication.type === 'api_key') {
        headers['X-API-Key'] = this.config.authentication.credentials;
      } else if (this.config.authentication.type === 'basic') {
        headers['Authorization'] = `Basic ${this.config.authentication.credentials}`;
      }
    }

    return headers;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const ttl = this.config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    return Date.now() - cached.timestamp < ttl;
  }

  async list(options?: QueryOptions): Promise<DataSourceResponse> {
    const cacheKey = `list:${JSON.stringify(options || {})}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const url = new URL(this.config.endpoints.list, this.config.baseUrl);

    // Add query parameters
    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        url.searchParams.append(key, String(value));
      }
    }

    if (options?.pagination) {
      url.searchParams.append('page', String(options.pagination.page));
      url.searchParams.append('limit', String(options.pagination.limit));
    }

    if (options?.sort) {
      url.searchParams.append('sort', options.sort.field);
      url.searchParams.append('order', options.sort.order);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`REST API error: ${response.statusText}`);
    }

    const result: DataSourceResponse = await response.json();
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  async getById(id: string): Promise<DataItem | null> {
    if (!this.config.endpoints.getById) {
      throw new Error('getById endpoint not configured');
    }

    const cacheKey = `getById:${id}`;
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached?.data.data[0] || null;
    }

    const endpoint = this.config.endpoints.getById.replace('{id}', id);
    const url = new URL(endpoint, this.config.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`REST API error: ${response.statusText}`);
    }

    const item = await response.json();
    this.cache.set(cacheKey, {
      data: { data: [item], total: 1 },
      timestamp: Date.now(),
    });
    return item;
  }

  async search(query: string, options?: QueryOptions): Promise<DataSourceResponse> {
    if (!this.config.endpoints.search) {
      // Fallback to list with search filter
      return this.list({ ...options, search: query });
    }

    const url = new URL(this.config.endpoints.search, this.config.baseUrl);
    const body = {
      query,
      ...options?.filter,
      ...options?.pagination,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`REST API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async create(data: Partial<DataItem>): Promise<DataItem> {
    if (!this.config.endpoints.create) {
      throw new Error('Create endpoint not configured');
    }

    const url = new URL(this.config.endpoints.create, this.config.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`REST API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async update(id: string, data: Partial<DataItem>): Promise<DataItem> {
    if (!this.config.endpoints.update) {
      throw new Error('Update endpoint not configured');
    }

    const endpoint = this.config.endpoints.update.replace('{id}', id);
    const url = new URL(endpoint, this.config.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`REST API error: ${response.statusText}`);
    }

    this.cache.delete(`getById:${id}`);
    return await response.json();
  }

  async delete(id: string): Promise<boolean> {
    if (!this.config.endpoints.delete) {
      throw new Error('Delete endpoint not configured');
    }

    const endpoint = this.config.endpoints.delete.replace('{id}', id);
    const url = new URL(endpoint, this.config.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    this.cache.delete(`getById:${id}`);
    return response.ok;
  }
}

/**
 * SQL Data Source Adapter (Backend-only, shown for reference)
 * This would typically run on the backend
 */
export class SQLDataSourceAdapter implements IDataSourceAdapter {
  private config!: SQLDataSourceConfig;
  // Connection pool would be managed here
  // private pool!: Pool;

  async init(config: DataSourceConfig): Promise<void> {
    if (config.type !== DataSourceType.SQL) {
      throw new Error('Invalid config type for SQLDataSourceAdapter');
    }

    this.config = config as SQLDataSourceConfig;
    // Initialize database connection pool
    // this.pool = new Pool({ connectionString: config.connectionString });
    console.log(`[SQL] Initialized with table: ${this.config.table}`);
  }

  async list(): Promise<DataSourceResponse> {
    throw new Error('SQL adapter should run on backend only');
  }

  async getById(): Promise<DataItem | null> {
    throw new Error('SQL adapter should run on backend only');
  }

  async search(): Promise<DataSourceResponse> {
    throw new Error('SQL adapter should run on backend only');
  }

  async disconnect(): Promise<void> {
    // Close database connection pool
    // if (this.pool) await this.pool.end();
  }
}

/**
 * GraphQL Data Source Adapter
 * Fetches data from GraphQL endpoints
 */
export class GraphQLDataSourceAdapter implements IDataSourceAdapter {
  private config!: GraphQLDataSourceConfig;
  private cache: Map<string, { data: DataSourceResponse; timestamp: number }> = new Map();

  async init(config: DataSourceConfig): Promise<void> {
    if (config.type !== DataSourceType.GRAPHQL) {
      throw new Error('Invalid config type for GraphQLDataSourceAdapter');
    }

    this.config = config as GraphQLDataSourceConfig;
    console.log(`[GraphQL] Initialized with endpoint: ${this.config.endpoint}`);
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.headers || {}),
    };

    if (this.config.authentication) {
      if (this.config.authentication.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.config.authentication.credentials}`;
      } else if (this.config.authentication.type === 'api_key') {
        headers['X-API-Key'] = this.config.authentication.credentials;
      }
    }

    return headers;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const ttl = this.config.cacheTTL || 5 * 60 * 1000;
    return Date.now() - cached.timestamp < ttl;
  }

  async list(): Promise<DataSourceResponse> {
    const cacheKey = 'list';
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ query: this.config.queries.list }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.statusText}`);
    }

    const result = await response.json();
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  async getById(id: string): Promise<DataItem | null> {
    if (!this.config.queries.getById) {
      throw new Error('getById query not configured');
    }

    const cacheKey = `getById:${id}`;
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached?.data.data[0] || null;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        query: this.config.queries.getById,
        variables: { id },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) return null;

    this.cache.set(cacheKey, {
      data: { data: [result.data], total: 1 },
      timestamp: Date.now(),
    });
    return result.data;
  }

  async search(query: string): Promise<DataSourceResponse> {
    if (!this.config.queries.search) {
      throw new Error('Search query not configured');
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        query: this.config.queries.search,
        variables: { query },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.statusText}`);
    }

    return await response.json();
  }
}
