/**
 * useStreamingQuery Hook
 *
 * Custom hook for Server-Sent Events (SSE) query streaming.
 * Provides real-time progress updates through 3 stages:
 * 1. query_understanding - Query parsing and understanding
 * 2. retrieval - Artifact retrieval
 * 3. generation - Answer generation
 *
 * Tech Stack: React + TypeScript + EventSource API
 */

import { useState, useRef, useCallback } from 'react';
import { UIResponse } from '../types';

/**
 * Stream update from SSE
 */
export interface StreamUpdate {
  stage: string;
  status?: 'in_progress' | 'complete';
  data?: any;
  duration_ms?: number;
  message?: string;
  error?: string;
  code?: string;
  total_duration_ms?: number;
}

/**
 * Stage names for streaming
 */
export type StreamStage = 'query_understanding' | 'retrieval' | 'generation' | 'done' | 'error';

/**
 * Stage display information
 */
export interface StageInfo {
  name: string;
  description: string;
  icon: string;
}

/**
 * Stage metadata mapping
 */
export const STAGE_INFO: Record<StreamStage, StageInfo> = {
  query_understanding: {
    name: 'Understanding Query',
    description: 'Parsing and analyzing your question',
    icon: '🧠',
  },
  retrieval: {
    name: 'Searching Records',
    description: 'Finding relevant medical records',
    icon: '🔍',
  },
  generation: {
    name: 'Generating Answer',
    description: 'Creating comprehensive response',
    icon: '✍️',
  },
  done: {
    name: 'Complete',
    description: 'Query processed successfully',
    icon: '✅',
  },
  error: {
    name: 'Error',
    description: 'An error occurred',
    icon: '❌',
  },
};

/**
 * Hook return type
 */
export interface UseStreamingQueryReturn {
  updates: StreamUpdate[];
  isStreaming: boolean;
  finalResult: UIResponse | null;
  error: string | null;
  startStream: (query: string, patientId: string, options?: StreamOptions) => void;
  cancelStream: () => void;
  currentStage: StreamStage | null;
  progress: number; // 0-100
}

/**
 * Stream options
 */
export interface StreamOptions {
  detail_level?: number;
  max_results?: number;
}

/**
 * useStreamingQuery Hook
 *
 * Manages Server-Sent Events connection for streaming query results.
 *
 * @returns Hook state and controls
 *
 * @example
 * ```tsx
 * const { startStream, isStreaming, updates, finalResult, error } = useStreamingQuery();
 *
 * const handleSearch = () => {
 *   startStream('What medications is the patient taking?', 'patient-123');
 * };
 *
 * // Show progress
 * {updates.map(update => (
 *   <div>{STAGE_INFO[update.stage]?.name}: {update.status}</div>
 * ))}
 * ```
 */
export function useStreamingQuery(): UseStreamingQueryReturn {
  const [updates, setUpdates] = useState<StreamUpdate[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [finalResult, setFinalResult] = useState<UIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<StreamStage | null>(null);
  const [progress, setProgress] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Calculate progress based on stage
   */
  const calculateProgress = (stage: StreamStage, status?: string): number => {
    const stageProgress: Record<StreamStage, number> = {
      query_understanding: 33,
      retrieval: 66,
      generation: 90,
      done: 100,
      error: 0,
    };

    const baseProgress = stageProgress[stage] || 0;

    // If in progress, show slightly less than stage completion
    if (status === 'in_progress' && stage !== 'done') {
      return Math.max(0, baseProgress - 10);
    }

    return baseProgress;
  };

  /**
   * Cancel active stream
   */
  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Start streaming query
   */
  const startStream = useCallback(
    (query: string, patientId: string, options?: StreamOptions) => {
      // Cancel any existing stream
      cancelStream();

      // Reset state
      setUpdates([]);
      setError(null);
      setFinalResult(null);
      setCurrentStage(null);
      setProgress(0);
      setIsStreaming(true);

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

        // Create EventSource for SSE
        // Note: EventSource only supports GET, so we'll use fetch + EventSource workaround
        // For POST support, we'll use fetch with streaming

        const fetchStream = async () => {
          try {
            const response = await fetch(`${baseURL}/api/query/stream`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query,
                patient_id: patientId,
                options: {
                  detail_level: options?.detail_level || 3,
                  max_results: options?.max_results || 5,
                },
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log('[StreamingQuery] Stream complete');
                setIsStreaming(false);
                break;
              }

              // Decode chunk and add to buffer
              buffer += decoder.decode(value, { stream: true });

              // Process complete SSE messages
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6); // Remove 'data: ' prefix

                  try {
                    const update: StreamUpdate = JSON.parse(data);

                    console.log('[StreamingQuery] Update:', update);

                    // Add to updates
                    setUpdates((prev) => [...prev, update]);

                    // Update current stage
                    if (update.stage) {
                      setCurrentStage(update.stage as StreamStage);
                      setProgress(calculateProgress(update.stage as StreamStage, update.status));
                    }

                    // Handle done
                    if (update.stage === 'done' && update.data) {
                      setFinalResult(update.data);
                      setIsStreaming(false);
                      setProgress(100);
                    }

                    // Handle error
                    if (update.stage === 'error') {
                      setError(update.error || update.message || 'Unknown error');
                      setIsStreaming(false);
                      setProgress(0);
                    }
                  } catch (parseError) {
                    console.error('[StreamingQuery] Failed to parse SSE data:', parseError);
                  }
                }
              }
            }
          } catch (fetchError) {
            console.error('[StreamingQuery] Fetch error:', fetchError);
            setError(
              fetchError instanceof Error
                ? fetchError.message
                : 'Failed to connect to streaming endpoint'
            );
            setIsStreaming(false);
          }
        };

        fetchStream();
      } catch (err) {
        console.error('[StreamingQuery] Setup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to start stream');
        setIsStreaming(false);
      }
    },
    [cancelStream]
  );

  return {
    updates,
    isStreaming,
    finalResult,
    error,
    startStream,
    cancelStream,
    currentStage,
    progress,
  };
}

export default useStreamingQuery;
