'use client';

/**
 * Data Source React Context
 * Provides data source access to all components
 */

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useDomainConfig } from './ConfigContext';
import { getDataSourceManager } from '@/services/datasource.service';
import { DataSourceManager } from '@/services/datasource.service';
import { DataItem, DataSourceResponse, QueryOptions } from '@/config/datasource.schema';

/**
 * Data Source Context Type
 */
interface DataSourceContextType {
  manager: DataSourceManager | null;
  loading: boolean;
  error: string | null;
  collections: string[];
  
  // Data access methods
  list(collection: string, options?: QueryOptions): Promise<DataSourceResponse>;
  getById(collection: string, id: string): Promise<DataItem | null>;
  search(collection: string, query: string, options?: QueryOptions): Promise<DataSourceResponse>;
  create(collection: string, data: Partial<DataItem>): Promise<DataItem>;
  update(collection: string, id: string, data: Partial<DataItem>): Promise<DataItem>;
  delete(collection: string, id: string): Promise<boolean>;
}

/**
 * Create context
 */
const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

/**
 * Data Source Provider Component
 */
export function DataSourceProvider({ children }: { children: ReactNode }) {
  const configContext = useDomainConfig();
  const config = (configContext?.config || {}) as any;
  const domain = (configContext?.config as any)?.domain || 'default';
  const [manager, setManager] = useState<DataSourceManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);

  // Initialize data sources from config
  useEffect(() => {
    const initializeDataSources = async () => {
      try {
        const dataSources = config?.dataSources;
        
        if (!dataSources) {
          console.log('[DataSourceProvider] No data sources configured');
          setManager(getDataSourceManager());
          setCollections([]);
          setLoading(false);
          return;
        }

        const dsManager = getDataSourceManager();

        // Register domain data sources
        await dsManager.registerDomain(domain, dataSources);

        // Get available collections
        const cols = dsManager.getCollections(domain);
        setCollections(cols);
        setManager(dsManager);

        console.log('[DataSourceProvider] Initialized with collections:', cols);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DataSourceProvider] Error:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    initializeDataSources();
  }, [config, domain]);

  // Helper methods
  const list = async (collection: string, options?: QueryOptions): Promise<DataSourceResponse> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.list(domain, collection, options);
  };

  const getById = async (collection: string, id: string): Promise<DataItem | null> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.getById(domain, collection, id);
  };

  const search = async (
    collection: string,
    query: string,
    options?: QueryOptions
  ): Promise<DataSourceResponse> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.search(domain, collection, query, options);
  };

  const create = async (
    collection: string,
    data: Partial<DataItem>
  ): Promise<DataItem> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.create(domain, collection, data);
  };

  const update = async (
    collection: string,
    id: string,
    data: Partial<DataItem>
  ): Promise<DataItem> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.update(domain, collection, id, data);
  };

  const deleteItem = async (collection: string, id: string): Promise<boolean> => {
    if (!manager) throw new Error('Data source not initialized');
    return manager.delete(domain, collection, id);
  };

  const value: DataSourceContextType = {
    manager,
    loading,
    error,
    collections,
    list,
    getById,
    search,
    create,
    update,
    delete: deleteItem,
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

/**
 * Hook: Access full data source context
 */
export function useDataSource(): DataSourceContextType {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }
  return context;
}

/**
 * Hook: List items from collection
 */
export function useDataList(
  collection: string,
  options?: QueryOptions
) {
  const { list, loading, error } = useDataSource();
  const [data, setData] = useState<DataSourceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [isError, setIsError] = useState<string | null>(error);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await list(collection, options);
        setData(result);
        setIsError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setIsError(errorMsg);
        console.error(`[useDataList] Error loading ${collection}:`, errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collection, list, options]);

  return { data, loading: isLoading, error: isError };
}

/**
 * Hook: Get single item by ID
 */
export function useDataItem(collection: string, id: string) {
  const { getById, loading, error } = useDataSource();
  const [data, setData] = useState<DataItem | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [isError, setIsError] = useState<string | null>(error);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getById(collection, id);
        setData(result);
        setIsError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setIsError(errorMsg);
        console.error(`[useDataItem] Error loading ${collection}/${id}:`, errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [collection, id, getById]);

  return { data, loading: isLoading, error: isError };
}

/**
 * Hook: Search collection
 */
export function useDataSearch(
  collection: string,
  query: string,
  options?: QueryOptions
) {
  const { search, loading, error } = useDataSource();
  const [data, setData] = useState<DataSourceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [isError, setIsError] = useState<string | null>(error);

  useEffect(() => {
    const fetchData = async () => {
      if (!query) {
        setData(null);
        return;
      }

      try {
        setIsLoading(true);
        const result = await search(collection, query, options);
        setData(result);
        setIsError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setIsError(errorMsg);
        console.error(`[useDataSearch] Error searching ${collection}:`, errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collection, query, search, options]);

  return { data, loading: isLoading, error: isError };
}
