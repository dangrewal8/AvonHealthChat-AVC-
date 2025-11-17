/**
 * React Query Hooks
 *
 * Custom hooks for data fetching and caching with React Query.
 *
 * Hooks:
 * - useSearch: Query hook for automatic search execution
 * - useRAGQuery: Mutation hook for manual search execution (legacy)
 * - useRecentQueries: Query hook for fetching recent query history
 *
 * Tech Stack: @tanstack/react-query + TypeScript
 */

import { useMutation, useQuery as useReactQuery } from '@tanstack/react-query';
import { queryRAG, getRecentQueries } from '../services/api';
import { UIResponse, QueryRequest, QueryHistoryItem } from '../types';

/**
 * Options for useSearch hook
 */
interface UseSearchOptions {
  patientId: string;
  enabled?: boolean;
  detail_level?: number;
  max_results?: number;
}

/**
 * useSearch Hook (Prompt 68 Specification)
 *
 * Query hook for automatic search execution when query changes.
 * Uses React Query's useQuery for automatic caching and refetching.
 *
 * @param query - Search query string
 * @param options - Search options (patientId, enabled, etc.)
 * @returns React Query result with data, loading, error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useSearch(
 *   "What medications is the patient taking?",
 *   { patientId: "patient-123" }
 * );
 * ```
 */
export function useSearch(
  query: string,
  options: UseSearchOptions = { patientId: 'default', enabled: true }
) {
  return useReactQuery<UIResponse | null, Error>({
    queryKey: ['search', query, options.patientId],
    queryFn: async () => {
      if (!query) return null;

      const response = await queryRAG({
        query,
        patient_id: options.patientId,
        options: {
          detail_level: options.detail_level || 3,
          max_results: options.max_results || 5,
        },
      });

      return response;
    },
    enabled: !!query && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * useRAGQuery Hook (Legacy)
 *
 * Mutation hook for manual search execution (user-triggered).
 * Uses React Query's useMutation for imperative queries.
 *
 * @returns Mutation hook with mutate, mutateAsync, isPending, isError
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
  return useMutation<UIResponse, Error, QueryRequest>({
    mutationFn: queryRAG,
    onError: (error) => {
      console.error('Query error:', error);
    },
  });
}

/**
 * useRecentQueries Hook
 *
 * Query hook for fetching recent query history.
 * Automatically refetches when patient changes.
 *
 * @param patientId - Patient ID
 * @param limit - Number of queries to fetch (default: 10)
 * @returns Query hook with history data
 *
 * @example
 * ```tsx
 * const { data: recentQueries, isLoading } = useRecentQueries("patient-123", 5);
 * ```
 */
export function useRecentQueries(patientId: string, limit: number = 10) {
  return useReactQuery<QueryHistoryItem[], Error>({
    queryKey: ['recent-queries', patientId, limit],
    queryFn: () => getRecentQueries(patientId, limit),
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000, // 1 minute (per Prompt 68 spec)
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Default export for backward compatibility
export default useRAGQuery;
