/**
 * React Hooks for API Queries
 *
 * Custom hooks for data fetching using native React hooks.
 *
 * Hooks:
 * - useRAGQuery: Hook for manual search execution (user-triggered)
 * - useRecentQueries: Hook for fetching recent query history
 *
 * Tech Stack: React + TypeScript (native hooks only)
 */

import { useState, useCallback } from 'react';
import { queryRAG, getRecentQueries } from '../services/api';
import { UIResponse, QueryRequest, QueryHistoryItem } from '../types';

/**
 * useRAGQuery Hook
 *
 * Hook for manual search execution (user-triggered).
 * Uses native React useState for state management.
 *
 * @returns Hook with mutateAsync, isPending, isError, error, data
 *
 * @example
 * ```tsx
 * const ragQuery = useRAGQuery();
 * const handleSearch = async (query: string) => {
 *   const result = await ragQuery.mutateAsync({
 *     query,
 *     patient_id: "patient-123",
 *     options: { detail_level: 3 }
 *   });
 * };
 * ```
 */
export function useRAGQuery() {
  const [data, setData] = useState<UIResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (request: QueryRequest): Promise<UIResponse> => {
    setIsPending(true);
    setError(null);

    try {
      const result = await queryRAG(request);
      setData(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Query error:', errorObj);
      throw errorObj;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
    isError: !!error,
    error,
    data,
  };
}

/**
 * useRecentQueries Hook
 *
 * Hook for fetching recent query history.
 * Uses native React useState for state management.
 *
 * @param patientId - Patient ID
 * @param limit - Number of queries to fetch (default: 10)
 * @returns Hook with data, isLoading, error, refetch
 *
 * @example
 * ```tsx
 * const { data: recentQueries, isLoading } = useRecentQueries("patient-123", 5);
 * ```
 */
export function useRecentQueries(patientId: string, limit: number = 10) {
  const [data, setData] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getRecentQueries(patientId, limit);
      setData(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Failed to fetch recent queries:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, limit]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// Default export for backward compatibility
export default useRAGQuery;
