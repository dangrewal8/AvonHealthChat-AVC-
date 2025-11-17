/**
 * React Query Hooks Demo
 *
 * Interactive demonstration of useSearch and useRAGQuery hooks.
 *
 * Tech Stack: React 18+ + TypeScript + @tanstack/react-query
 */

import { useState } from 'react';
import { useSearch, useRAGQuery, useRecentQueries } from './useQuery';
import { LoadingSkeleton } from '../components/LoadingState';
import { ErrorState, createErrorInfo } from '../components/ErrorState';
import { ResultsDisplay } from '../components/ResultsDisplay';

/**
 * Demo: useSearch Hook (Automatic Query Pattern)
 *
 * Uses React Query's useQuery for automatic execution when query changes.
 * Best for: Search-as-you-type, URL-driven searches
 */
export function UseSearchDemo() {
  const [query, setQuery] = useState('');
  const [patientId] = useState('patient-123');

  // useSearch hook - automatic execution
  const { data, isLoading, error, refetch } = useSearch(query, {
    patientId,
    enabled: query.length > 3, // Only search if query > 3 chars
  });

  return (
    <div className="space-y-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div>
        <h2 className="mb-2 text-xl font-bold text-blue-900">
          useSearch Hook Demo (Automatic Pattern)
        </h2>
        <p className="mb-4 text-sm text-blue-800">
          Type a query and it will automatically execute when you stop typing.
        </p>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a medical query..."
          className="w-full rounded-lg border border-blue-300 px-4 py-2"
        />

        <p className="mt-2 text-xs text-blue-700">
          Query will execute automatically when length &gt; 3 characters
        </p>
      </div>

      {/* Results */}
      <div>
        {isLoading && <LoadingSkeleton />}
        {error && (
          <ErrorState error={createErrorInfo(error)} onRetry={() => refetch()} />
        )}
        {data && <ResultsDisplay result={data} />}
        {!isLoading && !error && !data && query.length > 3 && (
          <p className="text-sm text-blue-700">No results yet...</p>
        )}
      </div>

      {/* Debug Info */}
      <details className="text-xs text-blue-800">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 overflow-auto rounded bg-blue-100 p-2">
          {JSON.stringify(
            {
              query,
              patientId,
              isLoading,
              hasError: !!error,
              hasData: !!data,
              enabled: query.length > 3,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}

/**
 * Demo: useRAGQuery Hook (Manual Query Pattern)
 *
 * Uses React Query's useMutation for manual execution (button click).
 * Best for: User-triggered searches, form submissions
 */
export function UseRAGQueryDemo() {
  const [query, setQuery] = useState('');
  const [patientId] = useState('patient-123');
  const [result, setResult] = useState<any>(null);

  // useRAGQuery hook - manual execution
  const ragQuery = useRAGQuery();

  const handleSearch = async () => {
    try {
      const response = await ragQuery.mutateAsync({
        query,
        patient_id: patientId,
        options: {
          detail_level: 3,
          max_results: 5,
        },
      });
      setResult(response);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleRetry = () => {
    if (query) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-green-200 bg-green-50 p-6">
      <div>
        <h2 className="mb-2 text-xl font-bold text-green-900">
          useRAGQuery Hook Demo (Manual Pattern)
        </h2>
        <p className="mb-4 text-sm text-green-800">
          Type a query and click "Search" to execute manually.
        </p>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a medical query..."
            className="flex-1 rounded-lg border border-green-300 px-4 py-2"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={!query || ragQuery.isPending}
            className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-300"
          >
            {ragQuery.isPending ? 'Searching...' : 'Search'}
          </button>
        </div>

        <p className="mt-2 text-xs text-green-700">
          Click "Search" button or press Enter to execute query
        </p>
      </div>

      {/* Results */}
      <div>
        {ragQuery.isPending && <LoadingSkeleton />}
        {ragQuery.isError && (
          <ErrorState
            error={createErrorInfo(ragQuery.error)}
            onRetry={handleRetry}
          />
        )}
        {result && !ragQuery.isPending && <ResultsDisplay result={result} />}
      </div>

      {/* Debug Info */}
      <details className="text-xs text-green-800">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 overflow-auto rounded bg-green-100 p-2">
          {JSON.stringify(
            {
              query,
              patientId,
              isPending: ragQuery.isPending,
              isError: ragQuery.isError,
              hasResult: !!result,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}

/**
 * Demo: useRecentQueries Hook
 *
 * Fetches and displays recent query history.
 */
export function UseRecentQueriesDemo() {
  const [patientId] = useState('patient-123');
  const { data: recentQueries, isLoading, error } = useRecentQueries(patientId, 5);

  return (
    <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-6">
      <div>
        <h2 className="mb-2 text-xl font-bold text-purple-900">
          useRecentQueries Hook Demo
        </h2>
        <p className="mb-4 text-sm text-purple-800">
          Displays recent query history for the current patient.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-purple-700">Loading recent queries...</p>
      )}

      {error && (
        <p className="text-sm text-red-700">Error loading queries: {error.message}</p>
      )}

      {recentQueries && recentQueries.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-purple-900">Recent Queries:</h3>
          <ul className="space-y-1">
            {recentQueries.map((item, index) => (
              <li
                key={index}
                className="rounded bg-purple-100 p-2 text-sm text-purple-800"
              >
                <strong>Query:</strong> {item.query}
                <br />
                <span className="text-xs text-purple-600">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentQueries && recentQueries.length === 0 && (
        <p className="text-sm text-purple-700">No recent queries found.</p>
      )}
    </div>
  );
}

/**
 * Main Demo Component
 *
 * Shows all three React Query hooks in action.
 */
export function ReactQueryDemo() {
  const [activeDemo, setActiveDemo] = useState<'search' | 'mutation' | 'history'>(
    'mutation'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            React Query Hooks Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of useSearch, useRAGQuery, and useRecentQueries
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Select Hook to Demo
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => setActiveDemo('mutation')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeDemo === 'mutation'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              useRAGQuery (Manual)
            </button>

            <button
              onClick={() => setActiveDemo('search')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeDemo === 'search'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              useSearch (Automatic)
            </button>

            <button
              onClick={() => setActiveDemo('history')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeDemo === 'history'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              useRecentQueries
            </button>
          </div>
        </div>

        {/* Hook Comparison */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Hook Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-2 text-left">Hook</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Execution</th>
                  <th className="p-2 text-left">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-2 font-medium">useSearch</td>
                  <td className="p-2">useQuery</td>
                  <td className="p-2">Automatic</td>
                  <td className="p-2">Search-as-you-type, URL-driven</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-2 font-medium">useRAGQuery</td>
                  <td className="p-2">useMutation</td>
                  <td className="p-2">Manual</td>
                  <td className="p-2">Button clicks, form submissions</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">useRecentQueries</td>
                  <td className="p-2">useQuery</td>
                  <td className="p-2">Automatic</td>
                  <td className="p-2">Background data loading</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Demo */}
        <div>
          {activeDemo === 'search' && <UseSearchDemo />}
          {activeDemo === 'mutation' && <UseRAGQueryDemo />}
          {activeDemo === 'history' && <UseRecentQueriesDemo />}
        </div>

        {/* React Query Features */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-yellow-900">
            React Query Features
          </h2>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Automatic Caching:</strong> Results cached for 5 minutes (configurable)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Smart Refetching:</strong> Only refetches when data is stale</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Error Handling:</strong> Built-in error states and retry logic</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Loading States:</strong> isPending, isLoading, isFetching states</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Background Updates:</strong> Refetch stale data in background</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span><strong>Query Invalidation:</strong> Manually invalidate cached queries</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ReactQueryDemo;
