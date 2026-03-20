'use client';

/**
 * Example Component: Using Data Source System
 * Demonstrates how to access and work with data from different sources
 */

import React, { useState } from 'react';
import { useDataList, useDataItem, useDataSearch } from '@/contexts/DataSourceContext';

/**
 * Example 1: List all items from collection
 */
export function ExerciseList() {
  const { data, loading, error } = useDataList('exercises', {
    pagination: { page: 1, limit: 10 },
    sort: { field: 'title', order: 'asc' },
  });

  if (loading) return <div className="p-4">Loading exercises...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-4">No data</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Exercises</h2>
      <div className="space-y-2">
        {data.data.map((exercise) => (
          <div key={exercise.id} className="p-2 border rounded">
            <h3 className="font-semibold">{exercise.title}</h3>
            <p className="text-sm text-gray-600">{exercise.description}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Showing {data.data.length} of {data.total} exercises
        {data.hasMore && ' (more available)'}
      </p>
    </div>
  );
}

/**
 * Example 2: Get single item by ID
 */
export function ExerciseDetail({ id }: { id: string }) {
  const { data, loading, error } = useDataItem('exercises', id);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-4">Exercise not found</div>;

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">{data.title}</h2>
      <p className="text-gray-600 my-2">{data.description}</p>
      {data.content && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">{data.content}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Search collection
 */
export function ExerciseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, loading, error } = useDataSearch('exercises', searchQuery);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search Exercises</h2>
      
      <input
        type="text"
        placeholder="Search exercises..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-4"
      />

      {loading && <div>Searching...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {data && (
        <div className="space-y-2">
          {data.data.length === 0 ? (
            <div className="text-gray-500">No results found</div>
          ) : (
            data.data.map((item) => (
              <div key={item.id} className="p-2 border rounded">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Multi-collection display
 * Shows how to work with different collections (Fitness, Business, Healthcare)
 */
export function DomainDataDisplay() {
  // Fitness domain collections
  const exercises = useDataList('exercises', { pagination: { page: 1, limit: 5 } });
  const workouts = useDataList('workoutPlans', { pagination: { page: 1, limit: 5 } });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Exercises from JSON */}
      <div className="border rounded p-4">
        <h3 className="text-lg font-bold mb-3">Exercises (JSON)</h3>
        {exercises.loading ? (
          <div>Loading...</div>
        ) : exercises.error ? (
          <div className="text-red-500">{exercises.error}</div>
        ) : (
          <div className="space-y-2">
            {exercises.data?.data.map((item) => (
              <div key={item.id} className="text-sm p-2 bg-gray-50 rounded">
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Plans from REST API or SQL */}
      <div className="border rounded p-4">
        <h3 className="text-lg font-bold mb-3">Workout Plans (API/DB)</h3>
        {workouts.loading ? (
          <div>Loading...</div>
        ) : workouts.error ? (
          <div className="text-red-500">{workouts.error}</div>
        ) : (
          <div className="space-y-2">
            {workouts.data?.data.map((item) => (
              <div key={item.id} className="text-sm p-2 bg-gray-50 rounded">
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 5: Component showing different data sources per domain
 */
export function DataSourceInfo() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Data Source Configuration</h2>

      <div className="space-y-3">
        <div className="border rounded p-3">
          <h3 className="font-semibold text-green-700">✓ Fitness Domain</h3>
          <ul className="text-sm text-gray-600 ml-4 mt-2 space-y-1">
            <li>• exercises: JSON file (/public/data/darebee_guides.json)</li>
            <li>• workoutPlans: REST API (api.darebee.com)</li>
          </ul>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold text-blue-700">✓ Business Domain</h3>
          <ul className="text-sm text-gray-600 ml-4 mt-2 space-y-1">
            <li>• companies: SQL Database (PostgreSQL)</li>
            <li>• mentors: REST API (api.business.com)</li>
          </ul>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold text-purple-700">✓ Healthcare Domain</h3>
          <ul className="text-sm text-gray-600 ml-4 mt-2 space-y-1">
            <li>• medicalRecords: REST API (secure-api.health.com)</li>
            <li>• appointments: GraphQL (graphql.health.com)</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <p className="text-blue-800">
          <strong>Key Benefit:</strong> Each collection can have a different data source.
          Components just call `useDataList('collection')` - they don't need to know where the data comes from!
        </p>
      </div>
    </div>
  );
}
