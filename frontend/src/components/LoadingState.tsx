/**
 * LoadingState Components
 *
 * Loading skeleton and spinner components for better UX during data fetching.
 *
 * Components:
 * - LoadingSkeleton: Full skeleton screen matching ResultsDisplay layout
 * - LoadingSpinner: Simple spinner for inline loading
 * - LoadingState: Legacy component (kept for backward compatibility)
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSkeleton Component
 *
 * Displays a skeleton screen that matches the structure of the ResultsDisplay component.
 * Uses Tailwind's animate-pulse for a smooth loading effect.
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-6 animate-pulse">
      {/* Answer skeleton */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
        <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
      </div>

      {/* Details skeleton */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-3 h-5 w-1/5 rounded bg-gray-200"></div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200"></div>
          <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          <div className="h-4 w-4/6 rounded bg-gray-200"></div>
        </div>
      </div>

      {/* Sources skeleton */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 h-5 w-1/6 rounded bg-gray-200"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded border-l-4 border-gray-300 bg-gray-50 p-3"
            >
              <div className="mb-2 h-4 w-1/3 rounded bg-gray-200"></div>
              <div className="mb-1 h-3 w-full rounded bg-gray-200"></div>
              <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * LoadingSpinner Component
 *
 * Simple centered spinner for inline loading states.
 * Uses Tailwind's animate-spin for rotation effect.
 */
export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
    </div>
  );
};

/**
 * LoadingState Component (Legacy)
 *
 * Original loading state component with icon and message.
 * Kept for backward compatibility with existing code.
 */
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-secondary">{message}</p>
    </div>
  );
}

export default LoadingState;
