/**
 * StreamingSearch Component
 *
 * Search component with Server-Sent Events (SSE) for real-time progress updates.
 * Displays 3-stage progress: query understanding → retrieval → generation
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, User } from 'lucide-react';
import { useStreamingQuery, STAGE_INFO, StreamStage } from '../hooks/useStreamingQuery';
import { ResultsDisplay } from './ResultsDisplay';
import { ErrorState, createErrorInfo } from './ErrorState';

/**
 * StreamingSearch Props
 */
export interface StreamingSearchProps {
  /** Initial patient ID (optional) */
  initialPatientId?: string;
  /** Detail level (1-3) */
  detailLevel?: number;
  /** Auto-focus search input */
  autoFocus?: boolean;
}

/**
 * StreamingSearch Component
 *
 * Interactive search with real-time progress indicators.
 *
 * @example
 * ```tsx
 * <StreamingSearch
 *   initialPatientId="patient-123"
 *   detailLevel={3}
 *   autoFocus={true}
 * />
 * ```
 */
export const StreamingSearch: React.FC<StreamingSearchProps> = ({
  initialPatientId = 'patient-123',
  detailLevel = 3,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [patientId] = useState(initialPatientId);

  const {
    startStream,
    cancelStream,
    isStreaming,
    updates,
    finalResult,
    error,
    currentStage,
    progress,
  } = useStreamingQuery();

  /**
   * Handle search button click
   */
  const handleSearch = () => {
    if (!query.trim() || isStreaming) return;

    startStream(query, patientId, {
      detail_level: detailLevel,
      max_results: 5,
    });
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isStreaming) {
      handleSearch();
    }
  };

  /**
   * Get stage status
   */
  const getStageStatus = (stage: StreamStage): 'pending' | 'in_progress' | 'complete' | 'error' => {
    const stageUpdates = updates.filter((u) => u.stage === stage);

    if (stageUpdates.length === 0) return 'pending';

    const latestUpdate = stageUpdates[stageUpdates.length - 1];

    if (stage === currentStage && isStreaming) return 'in_progress';
    if (latestUpdate.status === 'complete') return 'complete';
    if (latestUpdate.status === 'in_progress') return 'in_progress';

    return 'pending';
  };

  /**
   * Render stage indicator
   */
  const renderStageIndicator = (stage: StreamStage) => {
    const status = getStageStatus(stage);
    const info = STAGE_INFO[stage];

    const statusColors = {
      pending: 'bg-gray-200 text-gray-500 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse',
      complete: 'bg-green-100 text-green-700 border-green-300',
      error: 'bg-red-100 text-red-700 border-red-300',
    };

    const statusIcons = {
      pending: <div className="h-5 w-5 rounded-full border-2 border-gray-400" />,
      in_progress: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
      complete: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      error: <XCircle className="h-5 w-5 text-red-600" />,
    };

    return (
      <div
        key={stage}
        className={`flex items-center space-x-3 rounded-lg border p-4 transition-all ${statusColors[status]}`}
      >
        <div className="flex-shrink-0">{statusIcons[status]}</div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{info.icon}</span>
            <h3 className="font-semibold">{info.name}</h3>
          </div>
          <p className="mt-1 text-sm opacity-80">{info.description}</p>

          {/* Show duration if complete */}
          {status === 'complete' && (
            (() => {
              const update = updates.find((u) => u.stage === stage && u.status === 'complete');
              return update?.duration_ms ? (
                <p className="mt-1 text-xs opacity-60">{update.duration_ms}ms</p>
              ) : null;
            })()
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Streaming Search
        </h1>
        <p className="text-gray-600">
          Real-time progress updates with Server-Sent Events
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Patient Info */}
        <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
          <User size={16} />
          <span>Patient: {patientId}</span>
          <span className="text-gray-400">•</span>
          <span>Detail Level: {detailLevel}</span>
        </div>

        {/* Search Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={isStreaming}
            autoFocus={autoFocus}
          />

          {!isStreaming ? (
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="flex items-center space-x-2 rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Search size={20} />
              <span>Search</span>
            </button>
          ) : (
            <button
              onClick={cancelStream}
              className="flex items-center space-x-2 rounded-lg bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:bg-red-600"
            >
              <XCircle size={20} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicators */}
      {(isStreaming || updates.length > 0) && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Processing</h2>
            <div className="text-sm text-gray-600">{progress}% complete</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stage Indicators */}
          <div className="space-y-3">
            {renderStageIndicator('query_understanding')}
            {renderStageIndicator('retrieval')}
            {renderStageIndicator('generation')}
          </div>

          {/* Total Duration */}
          {!isStreaming && finalResult && (
            (() => {
              const doneUpdate = updates.find((u) => u.stage === 'done');
              return doneUpdate?.total_duration_ms ? (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-center text-sm text-blue-900">
                  <span className="font-semibold">Total time:</span> {doneUpdate.total_duration_ms}ms
                </div>
              ) : null;
            })()
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorState
          error={createErrorInfo(error)}
          onRetry={() => {
            if (query.trim()) {
              startStream(query, patientId, {
                detail_level: detailLevel,
                max_results: 5,
              });
            }
          }}
        />
      )}

      {/* Final Result */}
      {finalResult && !isStreaming && (
        <div className="animate-fadeIn">
          <ResultsDisplay result={finalResult} />
        </div>
      )}
    </div>
  );
};

export default StreamingSearch;
