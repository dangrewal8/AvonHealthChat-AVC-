/**
 * ErrorState Components
 *
 * Error handling and empty state components for graceful error display.
 *
 * Components:
 * - ErrorState: Displays errors with recovery suggestions and retry button
 * - EmptyState: Displays when no results are found
 * - NetworkErrorState: Specialized for network errors
 * - TimeoutErrorState: Specialized for timeout errors
 * - RateLimitErrorState: Specialized for rate limit errors
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import React from 'react';
import {
  AlertCircle,
  RefreshCw,
  FileText,
  WifiOff,
  Clock,
  ShieldAlert,
  XCircle
} from 'lucide-react';

/**
 * Error object interface
 */
export interface ErrorInfo {
  message: string;
  recovery_suggestion?: string;
  error_code?: string;
  details?: string;
}

/**
 * ErrorState Props
 */
interface ErrorStateProps {
  error: ErrorInfo;
  onRetry?: () => void;
  variant?: 'error' | 'warning';
}

/**
 * ErrorState Component
 *
 * Displays error messages with optional retry functionality.
 * Supports both error (red) and warning (yellow) variants.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  variant = 'error'
}) => {
  const colors = variant === 'error'
    ? {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        title: 'text-red-800',
        text: 'text-red-700',
        button: 'bg-red-600 hover:bg-red-700'
      }
    : {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-500',
        title: 'text-yellow-800',
        text: 'text-yellow-700',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      };

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className={`rounded-lg border p-6 ${colors.bg} ${colors.border}`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className={`flex-shrink-0 ${colors.icon}`} size={24} />
          <div className="flex-1">
            <h3 className={`mb-2 text-lg font-semibold ${colors.title}`}>
              {error.message}
            </h3>
            {error.recovery_suggestion && (
              <p className={`mb-4 text-sm ${colors.text}`}>
                {error.recovery_suggestion}
              </p>
            )}
            {error.error_code && (
              <p className={`mb-2 text-xs ${colors.text} opacity-75`}>
                Error Code: {error.error_code}
              </p>
            )}
            {error.details && (
              <details className={`mb-4 text-xs ${colors.text}`}>
                <summary className="cursor-pointer font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-white bg-opacity-50 p-2">
                  {error.details}
                </pre>
              </details>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center space-x-2 rounded-md px-4 py-2 text-white transition-colors ${colors.button}`}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * EmptyState Component
 *
 * Displays when no results are found or no content is available.
 */
export const EmptyState: React.FC = () => {
  return (
    <div className="mx-auto mt-12 max-w-2xl text-center">
      <div className="mb-4 text-gray-400">
        <FileText size={64} className="mx-auto" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-700">
        No results found
      </h3>
      <p className="text-gray-500">
        Try rephrasing your question or using different keywords
      </p>
    </div>
  );
};

/**
 * NetworkErrorState Component
 *
 * Specialized error state for network connectivity issues.
 */
interface NetworkErrorStateProps {
  onRetry?: () => void;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({ onRetry }) => {
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <WifiOff className="flex-shrink-0 text-red-500" size={24} />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-red-800">
              Network Connection Error
            </h3>
            <p className="mb-4 text-sm text-red-700">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <ul className="mb-4 ml-4 list-disc text-sm text-red-700">
              <li>Check your internet connection</li>
              <li>Verify the server is accessible</li>
              <li>Check if you're behind a firewall or proxy</li>
            </ul>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TimeoutErrorState Component
 *
 * Specialized error state for timeout errors.
 */
interface TimeoutErrorStateProps {
  onRetry?: () => void;
  timeout?: number;
}

export const TimeoutErrorState: React.FC<TimeoutErrorStateProps> = ({
  onRetry,
  timeout = 30
}) => {
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start space-x-3">
          <Clock className="flex-shrink-0 text-orange-500" size={24} />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-orange-800">
              Request Timeout
            </h3>
            <p className="mb-4 text-sm text-orange-700">
              The request took longer than expected ({timeout} seconds). This might be due to:
            </p>
            <ul className="mb-4 ml-4 list-disc text-sm text-orange-700">
              <li>Large dataset being processed</li>
              <li>Server under heavy load</li>
              <li>Slow network connection</li>
            </ul>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-2 rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * RateLimitErrorState Component
 *
 * Specialized error state for rate limit errors.
 */
interface RateLimitErrorStateProps {
  retryAfter?: number; // seconds
  onRetry?: () => void;
}

export const RateLimitErrorState: React.FC<RateLimitErrorStateProps> = ({
  retryAfter,
  onRetry
}) => {
  const [countdown, setCountdown] = React.useState(retryAfter || 0);

  React.useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="flex-shrink-0 text-purple-500" size={24} />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">
              Rate Limit Exceeded
            </h3>
            <p className="mb-4 text-sm text-purple-700">
              You've made too many requests in a short period. Please wait before trying again.
            </p>
            {retryAfter && countdown > 0 && (
              <p className="mb-4 text-sm font-medium text-purple-700">
                You can retry in: <span className="font-mono">{formatTime(countdown)}</span>
              </p>
            )}
            {onRetry && (countdown === 0 || !retryAfter) && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-2 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * AuthenticationErrorState Component
 *
 * Specialized error state for authentication errors.
 */
interface AuthenticationErrorStateProps {
  onLogin?: () => void;
}

export const AuthenticationErrorState: React.FC<AuthenticationErrorStateProps> = ({
  onLogin
}) => {
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <XCircle className="flex-shrink-0 text-red-500" size={24} />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-red-800">
              Authentication Required
            </h3>
            <p className="mb-4 text-sm text-red-700">
              You need to be authenticated to access this resource. Your session may have expired.
            </p>
            {onLogin && (
              <button
                onClick={onLogin}
                className="inline-flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to create error objects from various error types
 */
export const createErrorInfo = (error: unknown): ErrorInfo => {
  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return {
      message: err.message || 'An unexpected error occurred',
      recovery_suggestion: err.recovery_suggestion,
      error_code: err.code || err.error_code,
      details: err.details || JSON.stringify(error, null, 2),
    };
  }

  return {
    message: 'An unexpected error occurred',
    recovery_suggestion: 'Please try again or contact support if the issue persists',
  };
};

export default ErrorState;
