/**
 * ErrorState Demo Component
 *
 * Interactive demonstration of error state components.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { useState } from 'react';
import {
  ErrorState,
  EmptyState,
  NetworkErrorState,
  TimeoutErrorState,
  RateLimitErrorState,
  AuthenticationErrorState,
  createErrorInfo,
  ErrorInfo
} from './ErrorState';
import { PlayCircle } from 'lucide-react';

type ErrorType =
  | 'generic'
  | 'network'
  | 'timeout'
  | 'ratelimit'
  | 'auth'
  | 'empty'
  | 'warning'
  | 'custom';

export function ErrorStateDemo() {
  const [activeError, setActiveError] = useState<ErrorType | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    alert(`Retry clicked! Count: ${retryCount + 1}`);
  };

  const handleLogin = () => {
    alert('Login clicked!');
  };

  // Sample errors
  const genericError: ErrorInfo = {
    message: 'An error occurred while processing your request',
    recovery_suggestion: 'Please try again or contact support if the issue persists',
    error_code: 'ERR_500',
  };

  const customError: ErrorInfo = {
    message: 'Custom Error Example',
    recovery_suggestion: 'This is a customizable error with details',
    error_code: 'CUSTOM_001',
    details: JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint: '/api/query',
      method: 'POST',
      status: 500,
    }, null, 2),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Error States Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of error handling components
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Error Type Selector
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Generic Error */}
            <button
              onClick={() => setActiveError('generic')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'generic'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Generic Error
            </button>

            {/* Network Error */}
            <button
              onClick={() => setActiveError('network')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'network'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Network Error
            </button>

            {/* Timeout Error */}
            <button
              onClick={() => setActiveError('timeout')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'timeout'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Timeout Error
            </button>

            {/* Rate Limit Error */}
            <button
              onClick={() => setActiveError('ratelimit')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'ratelimit'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rate Limit
            </button>

            {/* Authentication Error */}
            <button
              onClick={() => setActiveError('auth')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'auth'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Auth Error
            </button>

            {/* Empty State */}
            <button
              onClick={() => setActiveError('empty')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'empty'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Empty State
            </button>

            {/* Warning State */}
            <button
              onClick={() => setActiveError('warning')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'warning'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Warning
            </button>

            {/* Custom Error */}
            <button
              onClick={() => setActiveError('custom')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeError === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Error
            </button>
          </div>

          {/* Clear Button */}
          {activeError && (
            <button
              onClick={() => setActiveError(null)}
              className="mt-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Clear Error
            </button>
          )}

          {/* Retry Counter */}
          {retryCount > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Retry count: <span className="font-semibold">{retryCount}</span>
            </p>
          )}
        </div>

        {/* Component Documentation */}
        <div className="mb-8 space-y-4">
          {/* ErrorState Info */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-red-900">
              ErrorState Component
            </h3>
            <p className="mb-2 text-sm text-red-800">
              Generic error component with customizable message, recovery suggestion, and retry functionality.
            </p>
            <div className="rounded bg-red-100 p-2">
              <code className="text-xs text-red-900">
                {`<ErrorState error={{ message: "Error", recovery_suggestion: "Try again" }} onRetry={handleRetry} />`}
              </code>
            </div>
          </div>

          {/* EmptyState Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              EmptyState Component
            </h3>
            <p className="mb-2 text-sm text-gray-800">
              Displays when no results are found. Simple and clean.
            </p>
            <div className="rounded bg-gray-100 p-2">
              <code className="text-xs text-gray-900">
                {`<EmptyState />`}
              </code>
            </div>
          </div>

          {/* Specialized Components Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              Specialized Error Components
            </h3>
            <p className="mb-2 text-sm text-blue-800">
              Pre-configured components for common error scenarios:
            </p>
            <ul className="ml-4 list-disc text-sm text-blue-800">
              <li><strong>NetworkErrorState</strong> - Connection issues</li>
              <li><strong>TimeoutErrorState</strong> - Request timeout</li>
              <li><strong>RateLimitErrorState</strong> - Rate limiting with countdown</li>
              <li><strong>AuthenticationErrorState</strong> - Auth required</li>
            </ul>
          </div>
        </div>

        {/* Demo Display Area */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Error Display
          </h2>

          {/* Render Active Error */}
          {activeError === 'generic' && (
            <ErrorState error={genericError} onRetry={handleRetry} />
          )}

          {activeError === 'network' && (
            <NetworkErrorState onRetry={handleRetry} />
          )}

          {activeError === 'timeout' && (
            <TimeoutErrorState onRetry={handleRetry} timeout={30} />
          )}

          {activeError === 'ratelimit' && (
            <RateLimitErrorState retryAfter={60} onRetry={handleRetry} />
          )}

          {activeError === 'auth' && (
            <AuthenticationErrorState onLogin={handleLogin} />
          )}

          {activeError === 'empty' && (
            <EmptyState />
          )}

          {activeError === 'warning' && (
            <ErrorState
              error={{
                message: 'Warning: Partial Results',
                recovery_suggestion: 'Some data could not be retrieved, but we found partial results.',
              }}
              variant="warning"
              onRetry={handleRetry}
            />
          )}

          {activeError === 'custom' && (
            <ErrorState error={customError} onRetry={handleRetry} />
          )}

          {/* Default State */}
          {!activeError && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <PlayCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No Error Selected
              </h3>
              <p className="text-gray-600">
                Click a button above to see the error components in action
              </p>
            </div>
          )}
        </div>

        {/* Usage Guide */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            When to Use Each Component
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-3">
              <h4 className="mb-1 font-semibold text-red-900">ErrorState (Generic)</h4>
              <p className="text-sm text-red-800">
                <strong>Use when:</strong> General errors that don't fit other categories. Customizable for any error scenario.
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <h4 className="mb-1 font-semibold text-red-900">NetworkErrorState</h4>
              <p className="text-sm text-red-800">
                <strong>Use when:</strong> Network connection issues, server unreachable, or DNS errors.
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-3">
              <h4 className="mb-1 font-semibold text-orange-900">TimeoutErrorState</h4>
              <p className="text-sm text-orange-800">
                <strong>Use when:</strong> Request takes too long to complete. Helpful for large data processing.
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3">
              <h4 className="mb-1 font-semibold text-purple-900">RateLimitErrorState</h4>
              <p className="text-sm text-purple-800">
                <strong>Use when:</strong> User exceeds API rate limits. Shows countdown timer if retry-after is provided.
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <h4 className="mb-1 font-semibold text-red-900">AuthenticationErrorState</h4>
              <p className="text-sm text-red-800">
                <strong>Use when:</strong> User is not authenticated or session has expired.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="mb-1 font-semibold text-gray-900">EmptyState</h4>
              <p className="text-sm text-gray-800">
                <strong>Use when:</strong> No results found for a query. Not an error, just empty results.
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3">
              <h4 className="mb-1 font-semibold text-yellow-900">ErrorState (Warning Variant)</h4>
              <p className="text-sm text-yellow-800">
                <strong>Use when:</strong> Non-critical issues or partial failures. Yellow styling for warnings.
              </p>
            </div>
          </div>
        </div>

        {/* Error Helper Function */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-blue-900">
            Error Helper Function
          </h2>
          <p className="mb-4 text-sm text-blue-800">
            Use <code className="rounded bg-blue-100 px-1 py-0.5">createErrorInfo()</code> to convert any error type to ErrorInfo:
          </p>
          <div className="rounded bg-blue-100 p-4">
            <pre className="text-xs text-blue-900">
{`try {
  await queryAPI();
} catch (error) {
  const errorInfo = createErrorInfo(error);
  return <ErrorState error={errorInfo} onRetry={handleRetry} />;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorStateDemo;
