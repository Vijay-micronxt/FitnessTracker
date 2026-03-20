/**
 * Data Source Configuration Schema
 * Defines interfaces for different data source types
 */

export enum DataSourceType {
  JSON = 'json',
  SQL = 'sql',
  REST_API = 'rest_api',
  GRAPHQL = 'graphql',
}

/**
 * Generic data item structure
 * All data sources return normalized data in this format
 */
export interface DataItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow domain-specific fields
}

/**
 * Query options for flexible data retrieval
 */
export interface QueryOptions {
  filter?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
  search?: string;
}

/**
 * Response from data source query
 */
export interface DataSourceResponse<T = DataItem> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

/**
 * Base data source configuration
 */
export interface BaseDataSourceConfig {
  type: DataSourceType;
  cacheTTL?: number; // Time to live in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * JSON File data source configuration
 * Example: { "type": "json", "filePath": "/data/guides.json" }
 */
export interface JSONDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.JSON;
  filePath: string; // Relative to /public directory
}

/**
 * SQL Database data source configuration
 * Example: { "type": "sql", "connectionString": "postgresql://...", "table": "exercises" }
 */
export interface SQLDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.SQL;
  connectionString: string;
  table: string;
  database?: string;
  // Query templates
  queries?: {
    list?: string;
    getById?: string;
    search?: string;
  };
}

/**
 * REST API data source configuration
 * Example: { "type": "rest_api", "baseUrl": "https://api.example.com", "endpoints": { "list": "/api/v1/exercises" } }
 */
export interface RESTAPIDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.REST_API;
  baseUrl: string;
  endpoints: {
    list: string; // GET endpoint for listing items
    getById?: string; // GET endpoint for single item (with {id} placeholder)
    search?: string; // POST endpoint for search
    create?: string; // POST endpoint for creating
    update?: string; // PUT endpoint for updating
    delete?: string; // DELETE endpoint for deleting
  };
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic';
    credentials: string;
  };
  timeout?: number;
}

/**
 * GraphQL data source configuration
 * Example: { "type": "graphql", "endpoint": "https://api.example.com/graphql", "queries": { "list": "query { exercises { id title } }" } }
 */
export interface GraphQLDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.GRAPHQL;
  endpoint: string;
  queries: {
    list: string; // GraphQL query for list
    getById?: string; // GraphQL query for single item
    search?: string; // GraphQL query for search
  };
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key';
    credentials: string;
  };
}

/**
 * Union type for all data source configurations
 */
export type DataSourceConfig =
  | JSONDataSourceConfig
  | SQLDataSourceConfig
  | RESTAPIDataSourceConfig
  | GraphQLDataSourceConfig;

/**
 * Domain-specific data source mapping
 * Maps collections/tables to their data sources
 */
export interface DomainDataSources {
  [collectionName: string]: DataSourceConfig;
}

/**
 * Example usage in domain config:
 * 
 * // Fitness domain with JSON files
 * {
 *   "dataSources": {
 *     "exercises": {
 *       "type": "json",
 *       "filePath": "/data/darebee_guides.json"
 *     },
 *     "workoutPlans": {
 *       "type": "rest_api",
 *       "baseUrl": "https://api.darebee.com",
 *       "endpoints": { "list": "/api/workouts" }
 *     }
 *   }
 * }
 * 
 * // Business domain with SQL
 * {
 *   "dataSources": {
 *     "companies": {
 *       "type": "sql",
 *       "connectionString": "postgresql://...",
 *       "table": "companies"
 *     }
 *   }
 * }
 * 
 * // Healthcare domain with REST API
 * {
 *   "dataSources": {
 *     "medicalRecords": {
 *       "type": "rest_api",
 *       "baseUrl": "https://api.healthcare.com",
 *       "endpoints": {
 *         "list": "/api/records",
 *         "getById": "/api/records/{id}"
 *       }
 *     }
 *   }
 * }
 */
