/**
 * LoadingState Demo Component
 *
 * Interactive demonstration of loading skeleton and spinner components.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { useState } from 'react';
import { LoadingSkeleton, LoadingSpinner, LoadingState } from './LoadingState';
import { PlayCircle, StopCircle } from 'lucide-react';

export function LoadingStateDemo() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Loading States Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of loading skeleton and spinner components
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Controls</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Skeleton Toggle */}
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`flex items-center justify-center rounded-lg px-4 py-3 font-medium transition-colors ${
                showSkeleton
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {showSkeleton ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Hide Skeleton
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Show Skeleton
                </>
              )}
            </button>

            {/* Spinner Toggle */}
            <button
              onClick={() => setShowSpinner(!showSpinner)}
              className={`flex items-center justify-center rounded-lg px-4 py-3 font-medium transition-colors ${
                showSpinner
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {showSpinner ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Hide Spinner
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Show Spinner
                </>
              )}
            </button>

            {/* Legacy Toggle */}
            <button
              onClick={() => setShowLegacy(!showLegacy)}
              className={`flex items-center justify-center rounded-lg px-4 py-3 font-medium transition-colors ${
                showLegacy
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {showLegacy ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Hide Legacy
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Show Legacy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Component Documentation */}
        <div className="mb-8 space-y-6">
          {/* LoadingSkeleton Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              LoadingSkeleton Component
            </h3>
            <p className="mb-3 text-sm text-blue-800">
              Full skeleton screen that matches the ResultsDisplay layout. Best for
              displaying while waiting for query results.
            </p>
            <div className="rounded bg-blue-100 p-3">
              <code className="text-xs text-blue-900">
                {`import { LoadingSkeleton } from './components/LoadingState';`}
                <br />
                {`<LoadingSkeleton />`}
              </code>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p className="font-semibold">Features:</p>
              <ul className="ml-4 mt-1 list-disc">
                <li>Matches ResultsDisplay structure (Answer, Details, Sources)</li>
                <li>Uses Tailwind's animate-pulse for smooth animation</li>
                <li>Responsive design with max-width constraint</li>
                <li>Three skeleton source cards</li>
              </ul>
            </div>
          </div>

          {/* LoadingSpinner Info */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-green-900">
              LoadingSpinner Component
            </h3>
            <p className="mb-3 text-sm text-green-800">
              Simple centered spinner for inline loading states. Lightweight and
              minimal.
            </p>
            <div className="rounded bg-green-100 p-3">
              <code className="text-xs text-green-900">
                {`import { LoadingSpinner } from './components/LoadingState';`}
                <br />
                {`<LoadingSpinner />`}
              </code>
            </div>
            <div className="mt-3 text-xs text-green-700">
              <p className="font-semibold">Features:</p>
              <ul className="ml-4 mt-1 list-disc">
                <li>Pure CSS spinner (no icon dependencies)</li>
                <li>Uses Tailwind's animate-spin for rotation</li>
                <li>Centered with padding</li>
                <li>Blue border for brand consistency</li>
              </ul>
            </div>
          </div>

          {/* LoadingState (Legacy) Info */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-purple-900">
              LoadingState Component (Legacy)
            </h3>
            <p className="mb-3 text-sm text-purple-800">
              Original loading component with icon and message. Kept for backward
              compatibility.
            </p>
            <div className="rounded bg-purple-100 p-3">
              <code className="text-xs text-purple-900">
                {`import { LoadingState } from './components/LoadingState';`}
                <br />
                {`<LoadingState message="Loading..." />`}
              </code>
            </div>
            <div className="mt-3 text-xs text-purple-700">
              <p className="font-semibold">Props:</p>
              <ul className="ml-4 mt-1 list-disc">
                <li>message (optional): Custom loading message</li>
              </ul>
              <p className="mt-2 font-semibold">Features:</p>
              <ul className="ml-4 mt-1 list-disc">
                <li>Uses lucide-react Loader2 icon</li>
                <li>Customizable message text</li>
                <li>Centered layout with icon and text</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Display Area */}
        <div className="space-y-8">
          {/* LoadingSkeleton Demo */}
          {showSkeleton && (
            <div>
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-semibold text-blue-900">
                  LoadingSkeleton in action:
                </p>
              </div>
              <LoadingSkeleton />
            </div>
          )}

          {/* LoadingSpinner Demo */}
          {showSpinner && (
            <div>
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-semibold text-green-900">
                  LoadingSpinner in action:
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <LoadingSpinner />
              </div>
            </div>
          )}

          {/* LoadingState (Legacy) Demo */}
          {showLegacy && (
            <div>
              <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-sm font-semibold text-purple-900">
                  LoadingState (Legacy) in action:
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <LoadingState message="Searching medical records..." />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!showSkeleton && !showSpinner && !showLegacy && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <PlayCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No Loading State Active
              </h3>
              <p className="text-gray-600">
                Click the buttons above to see the loading components in action
              </p>
            </div>
          )}
        </div>

        {/* Usage Comparison */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            When to Use Each Component
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-1 font-semibold text-blue-900">LoadingSkeleton</h4>
              <p className="text-sm text-blue-800">
                <strong>Use when:</strong> Waiting for query results that will display in
                ResultsDisplay component. Provides best UX by showing the expected layout
                structure.
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Example: Main App.tsx query loading state
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-1 font-semibold text-green-900">LoadingSpinner</h4>
              <p className="text-sm text-green-800">
                <strong>Use when:</strong> Loading smaller sections, inline operations, or
                when a full skeleton would be overkill. Lightweight and minimal.
              </p>
              <p className="mt-2 text-xs text-green-700">
                Example: Button loading states, partial page updates
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="mb-1 font-semibold text-purple-900">
                LoadingState (Legacy)
              </h4>
              <p className="text-sm text-purple-800">
                <strong>Use when:</strong> You need a loading indicator with a custom
                message, or for backward compatibility with existing code.
              </p>
              <p className="mt-2 text-xs text-purple-700">
                Example: Modal dialogs, form submissions with status messages
              </p>
            </div>
          </div>
        </div>

        {/* Performance Notes */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="mb-3 text-lg font-semibold text-yellow-900">
            Performance & Best Practices
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                All components use pure CSS animations (no JavaScript animation loops)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                Tailwind's animate-pulse and animate-spin are GPU-accelerated
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>LoadingSkeleton matches actual content dimensions for no layout shift</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                Use LoadingSkeleton when loading time &gt; 300ms for better perceived
                performance
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                LoadingSpinner is lighter (&lt;100 bytes) compared to LoadingSkeleton
                (~300 bytes)
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoadingStateDemo;
