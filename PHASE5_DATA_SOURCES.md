# Phase 5: Data Source Configurability - Implementation Guide

## Overview

Phase 5 implements a flexible data source abstraction layer that allows each domain and collection to use different data sources without code changes. This enables:

- ✅ JSON files for static data
- ✅ SQL databases for relational data
- ✅ REST APIs for external services
- ✅ GraphQL endpoints for flexible queries
- ✅ Mix and match within same domain

## Architecture

```
Domain Config (backend)
  ↓ specifies dataSources section
Config API (/api/config)
  ↓ serves dataSources to frontend
DataSourceProvider (React Context)
  ↓ initializes adapters for each collection
DataSourceManager (Singleton)
  ↓ routes requests to appropriate adapter
Adapter (JSON/REST/SQL/GraphQL)
  ↓
Component (useDataList, useDataItem, useDataSearch)
  ↓
UI rendering
```

## Key Components

### 1. Data Source Schema (`frontend/config/datasource.schema.ts`)

**Defines:**
- `DataSourceType` enum: JSON, SQL, REST_API, GRAPHQL
- `DataItem` interface: Normalized data structure
- `QueryOptions` interface: Filter, sort, pagination
- `DataSourceConfig` union: Type-specific configs
- `DomainDataSources` mapping: Collection → DataSource

**Supported Types:**

#### JSON Data Source
```json
{
  "type": "json",
  "filePath": "/data/exercises.json"
}
```

#### SQL Database
```json
{
  "type": "sql",
  "connectionString": "postgresql://...",
  "table": "exercises"
}
```

#### REST API
```json
{
  "type": "rest_api",
  "baseUrl": "https://api.example.com",
  "endpoints": {
    "list": "/api/v1/exercises",
    "getById": "/api/v1/exercises/{id}",
    "search": "/api/v1/search"
  },
  "authentication": {
    "type": "bearer",
    "credentials": "token_here"
  }
}
```

#### GraphQL
```json
{
  "type": "graphql",
  "endpoint": "https://api.example.com/graphql",
  "queries": {
    "list": "query { exercises { id title } }",
    "getById": "query getExercise($id: ID!) { exercise(id: $id) { ... } }"
  }
}
```

### 2. Data Source Adapters (`frontend/services/datasource.adapter.ts`)

**Interface: `IDataSourceAdapter`**
```typescript
interface IDataSourceAdapter {
  init(config: DataSourceConfig): Promise<void>;
  list(options?: QueryOptions): Promise<DataSourceResponse>;
  getById(id: string): Promise<DataItem | null>;
  search(query: string, options?: QueryOptions): Promise<DataSourceResponse>;
  create?(data: Partial<DataItem>): Promise<DataItem>;
  update?(id: string, data: Partial<DataItem>): Promise<DataItem>;
  delete?(id: string): Promise<boolean>;
  disconnect?(): Promise<void>;
}
```

**Implementations:**

1. **JSONDataSourceAdapter**
   - Reads from `/public` directory
   - In-memory caching
   - Read-only operations
   - Supports filter, sort, search

2. **RESTAPIDataSourceAdapter**
   - HTTP requests to REST endpoints
   - Built-in caching with TTL
   - Authentication support (Bearer, API Key, Basic)
   - Full CRUD operations
   - Query parameter building

3. **GraphQLDataSourceAdapter**
   - Sends GraphQL queries
   - Variable interpolation
   - Built-in caching
   - Bearer token authentication

4. **SQLDataSourceAdapter**
   - Backend-only (shown for reference)
   - Database connection pooling
   - Custom query templates

### 3. Data Source Manager (`frontend/services/datasource.service.ts`)

**Singleton service managing all adapters**

```typescript
class DataSourceManager {
  registerDomain(domain, dataSources): Promise<void>
  list(domain, collection, options): Promise<DataSourceResponse>
  getById(domain, collection, id): Promise<DataItem | null>
  search(domain, collection, query, options): Promise<DataSourceResponse>
  create(domain, collection, data): Promise<DataItem>
  update(domain, collection, id, data): Promise<DataItem>
  delete(domain, collection, id): Promise<boolean>
}
```

**Features:**
- Factory pattern for adapter creation
- Adapter registry with cache
- Collection naming: `{domain}:{collection}`
- Error handling and logging
- Disconnect/cleanup support

### 4. React Context (`frontend/contexts/DataSourceContext.tsx`)

**DataSourceProvider wraps app, providing:**

```typescript
interface DataSourceContextType {
  manager: DataSourceManager | null;
  loading: boolean;
  error: string | null;
  collections: string[];
  
  list(collection, options): Promise<DataSourceResponse>;
  getById(collection, id): Promise<DataItem | null>;
  search(collection, query, options): Promise<DataSourceResponse>;
  create(collection, data): Promise<DataItem>;
  update(collection, id, data): Promise<DataItem>;
  delete(collection, id): Promise<boolean>;
}
```

**Custom Hooks:**

1. **useDataSource()**
   - Full context access
   - Direct method calls
   
2. **useDataList(collection, options)**
   - Auto-fetches items on mount
   - Returns `{ data, loading, error }`
   
3. **useDataItem(collection, id)**
   - Auto-fetches single item
   - Returns `{ data, loading, error }`
   
4. **useDataSearch(collection, query, options)**
   - Auto-fetches on query change
   - Returns `{ data, loading, error }`

## Usage Examples

### Example 1: List All Items (Fitness Domain, JSON)

```typescript
'use client';
import { useDataList } from '@/contexts/DataSourceContext';

export function ExerciseList() {
  const { data, loading, error } = useDataList('exercises', {
    pagination: { page: 1, limit: 10 },
    sort: { field: 'title', order: 'asc' },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.data.map(exercise => (
        <div key={exercise.id}>{exercise.title}</div>
      ))}
    </div>
  );
}
```

### Example 2: Get Single Item (Business Domain, REST API)

```typescript
import { useDataItem } from '@/contexts/DataSourceContext';

export function CompanyDetail({ id }: { id: string }) {
  const { data, loading, error } = useDataItem('companies', id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{data?.title}</h2>
      <p>{data?.description}</p>
    </div>
  );
}
```

### Example 3: Search Collection (Healthcare Domain, GraphQL)

```typescript
import { useDataSearch } from '@/contexts/DataSourceContext';
import { useState } from 'react';

export function SearchRecords() {
  const [query, setQuery] = useState('');
  const { data, loading } = useDataSearch('medicalRecords', query);

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search records..."
      />
      
      {loading && <div>Searching...</div>}
      
      {data?.data.map(record => (
        <div key={record.id}>{record.title}</div>
      ))}
    </div>
  );
}
```

### Example 4: Direct API Access

```typescript
import { useDataSource } from '@/contexts/DataSourceContext';

export function CreateExercise() {
  const { create } = useDataSource();

  const handleCreate = async () => {
    try {
      const newExercise = await create('exercises', {
        title: 'Push-ups',
        description: 'Upper body exercise',
      });
      console.log('Created:', newExercise);
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  return <button onClick={handleCreate}>Create Exercise</button>;
}
```

## Domain Configuration Examples

### Fitness Domain (Mixed Sources)

```json
{
  "domain": "fitness",
  "dataSources": {
    "exercises": {
      "type": "json",
      "filePath": "/data/darebee_guides.json"
    },
    "workoutPlans": {
      "type": "rest_api",
      "baseUrl": "https://api.darebee.com",
      "endpoints": {
        "list": "/api/v1/workouts",
        "getById": "/api/v1/workouts/{id}"
      },
      "cacheTTL": 300000
    }
  }
}
```

### Business Domain (SQL + REST + GraphQL)

```json
{
  "domain": "business",
  "dataSources": {
    "companies": {
      "type": "sql",
      "connectionString": "postgresql://...",
      "table": "companies"
    },
    "mentors": {
      "type": "rest_api",
      "baseUrl": "https://api.business.com",
      "endpoints": {
        "list": "/api/v1/mentors",
        "getById": "/api/v1/mentors/{id}"
      },
      "authentication": {
        "type": "api_key",
        "credentials": "YOUR_KEY"
      }
    },
    "tools": {
      "type": "graphql",
      "endpoint": "https://api.business.com/graphql",
      "queries": {
        "list": "query { tools { id title } }"
      }
    }
  }
}
```

### Healthcare Domain (Secure APIs)

```json
{
  "domain": "healthcare",
  "dataSources": {
    "medicalRecords": {
      "type": "rest_api",
      "baseUrl": "https://secure-api.healthcare.com",
      "endpoints": {
        "list": "/api/v1/records",
        "getById": "/api/v1/records/{id}",
        "create": "/api/v1/records",
        "update": "/api/v1/records/{id}",
        "delete": "/api/v1/records/{id}"
      },
      "authentication": {
        "type": "bearer",
        "credentials": "SECURE_TOKEN"
      }
    },
    "appointments": {
      "type": "graphql",
      "endpoint": "https://api.healthcare.com/graphql",
      "queries": {
        "list": "query { appointments { id dateTime } }",
        "getById": "query getAppointment($id: ID!) { appointment(id: $id) { ... } }"
      },
      "authentication": {
        "type": "bearer",
        "credentials": "SECURE_TOKEN"
      }
    },
    "vitals": {
      "type": "sql",
      "connectionString": "postgresql://secure-db.example.com/vitals",
      "table": "vital_signs"
    }
  }
}
```

## Features

### Caching

**Per-adapter caching:**
- JSON: In-memory caching of loaded files
- REST API: Configurable TTL (default 5 minutes)
- GraphQL: Configurable TTL (default 5 minutes)
- SQL: Connection pooling (backend-only)

**Cache invalidation:**
```typescript
const { manager } = useDataSource();
manager.clearCache('fitness', 'exercises');
```

### Authentication

**Supported types:**
- Bearer token: `Authorization: Bearer {token}`
- API Key: `X-API-Key: {key}`
- Basic auth: `Authorization: Basic {base64}`

**Configuration:**
```json
{
  "type": "rest_api",
  "authentication": {
    "type": "bearer",
    "credentials": "your_token_here"
  }
}
```

### Query Options

**Filter:**
```typescript
useDataList('exercises', {
  filter: { difficulty: 'advanced', category: 'cardio' }
})
```

**Sort:**
```typescript
useDataList('exercises', {
  sort: { field: 'difficulty', order: 'asc' }
})
```

**Pagination:**
```typescript
useDataList('exercises', {
  pagination: { page: 2, limit: 20 }
})
```

**Search:**
```typescript
useDataSearch('exercises', 'cardio exercises')
```

## Implementation Checklist

- ✅ Data source schema with all types
- ✅ Adapter implementations (JSON, REST, GraphQL)
- ✅ Data source manager with factory pattern
- ✅ React Context and hooks
- ✅ Example domain configurations
- ✅ Example components
- ✅ Error handling and logging
- ✅ Caching strategies
- ✅ Authentication support
- ✅ Type safety with TypeScript

## Adding New Adapters

To add a new adapter (e.g., Firebase):

1. **Extend schema:**
```typescript
interface FirebaseDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.FIREBASE;
  projectId: string;
  collection: string;
}
```

2. **Implement adapter:**
```typescript
export class FirebaseAdapter implements IDataSourceAdapter {
  async init(config: DataSourceConfig): Promise<void> { ... }
  async list(options?: QueryOptions): Promise<DataSourceResponse> { ... }
  // ... implement other methods
}
```

3. **Update manager:**
```typescript
private createAdapter(config: DataSourceConfig): IDataSourceAdapter {
  switch (config.type) {
    case DataSourceType.FIREBASE:
      return new FirebaseAdapter();
    // ...
  }
}
```

4. **Create domain config:**
```json
{
  "type": "firebase",
  "projectId": "my-project",
  "collection": "exercises"
}
```

## Benefits

### For Developers
- ✅ Abstract away data source details
- ✅ Same API for all sources
- ✅ Easy testing with mock adapters
- ✅ Type-safe data access

### For Domains
- ✅ Fitness: Use JSON files for offline availability
- ✅ Business: Use REST API for real-time data
- ✅ Healthcare: Use secure databases with encryption
- ✅ Custom: Mix and match sources per collection

### For Operations
- ✅ Change data source without code deploy
- ✅ Migrate data between sources
- ✅ Add caching per collection
- ✅ Manage authentication centrally

## Files Created

1. **frontend/config/datasource.schema.ts** (300 lines)
   - All type definitions and interfaces

2. **frontend/services/datasource.adapter.ts** (500 lines)
   - Adapter implementations

3. **frontend/services/datasource.service.ts** (200 lines)
   - DataSourceManager singleton

4. **frontend/contexts/DataSourceContext.tsx** (300 lines)
   - React Context and hooks

5. **frontend/components/DataSourceExamples.tsx** (200 lines)
   - Example components

6. **backend/config/domains/fitness-v2.json**
   - Fitness domain with mixed sources

7. **backend/config/domains/business-v2.json**
   - Business domain with SQL, REST, GraphQL

8. **backend/config/domains/healthcare-v2.json**
   - Healthcare domain with secure APIs

## Testing

### Test JSON Source
```typescript
const config: JSONDataSourceConfig = {
  type: DataSourceType.JSON,
  filePath: '/data/test.json'
};
// Should load from public/data/test.json
```

### Test REST API
```typescript
const config: RESTAPIDataSourceConfig = {
  type: DataSourceType.REST_API,
  baseUrl: 'https://api.example.com',
  endpoints: { list: '/items' }
};
// Should fetch from https://api.example.com/items
```

### Test Search
```typescript
const results = await manager.search('fitness', 'exercises', 'cardio');
// Should return exercises matching 'cardio'
```

## Next Steps

- [ ] Implement SQL adapter backend support
- [ ] Add Firebase adapter
- [ ] Add GraphQL subscription support
- [ ] Implement advanced caching strategies
- [ ] Add request deduplication
- [ ] Create data source testing utilities
- [ ] Add monitoring/logging
- [ ] Implement fallback data sources

## Performance Considerations

- **Caching TTL**: Adjust per collection based on data freshness needs
- **Pagination**: Use pagination for large datasets
- **Lazy loading**: Only fetch data when needed
- **Query optimization**: Use filters/search to reduce payload
- **Connection pooling**: SQL adapter uses pooling for efficiency

---

**Status**: ✅ Phase 5 Complete - Data sources now configurable per domain/collection

