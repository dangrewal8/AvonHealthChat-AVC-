/**
 * API Service Demo
 *
 * Interactive demonstration of the API client with interceptors.
 *
 * Tech Stack: React 18+ + TypeScript + axios
 */

import { useState } from 'react';
import { apiClient, queryRAG, healthCheck } from './api';
import { LoadingSpinner } from '../components/LoadingState';

export function APIClientDemo() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassBasedAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiClient.search(
        'What medications is the patient taking?',
        'patient-123',
        { detail_level: 3, max_results: 5 }
      );
      setResponse(result.data);
    } catch (err: any) {
      setError(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleLegacyAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await queryRAG({
        query: 'What medications is the patient taking?',
        patient_id: 'patient-123',
        options: { detail_level: 3, max_results: 5 },
      });
      setResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await healthCheck();
      setResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkError = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Try to call non-existent endpoint
      const result = await apiClient.getClient().get('/api/nonexistent');
      setResponse(result.data);
    } catch (err: any) {
      setError(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            API Service Layer Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of class-based API client with interceptors
          </p>
        </div>

        {/* API Pattern Comparison */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            API Usage Patterns
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Class-based */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                Class-based (New)
              </h3>
              <pre className="mb-3 overflow-auto rounded bg-blue-100 p-2 text-xs text-blue-900">
{`apiClient.search(
  query,
  patientId,
  options
);`}
              </pre>
              <button
                onClick={handleClassBasedAPI}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
              >
                Try Class-based API
              </button>
            </div>

            {/* Function-based */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 font-semibold text-green-900">
                Function-based (Legacy)
              </h3>
              <pre className="mb-3 overflow-auto rounded bg-green-100 p-2 text-xs text-green-900">
{`queryRAG({
  query,
  patient_id,
  options
});`}
              </pre>
              <button
                onClick={handleLegacyAPI}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-300"
              >
                Try Legacy API
              </button>
            </div>
          </div>
        </div>

        {/* Test Endpoints */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Test Endpoints
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={handleHealthCheck}
              disabled={loading}
              className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-gray-300"
            >
              Health Check
            </button>

            <button
              onClick={handleNetworkError}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-300"
            >
              Test Error Handling
            </button>

            <button
              onClick={() => {
                setResponse(null);
                setError(null);
              }}
              className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Response Display */}
        <div className="space-y-4">
          {/* Loading */}
          {loading && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <LoadingSpinner />
            </div>
          )}

          {/* Success Response */}
          {response && !loading && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="mb-3 font-semibold text-green-900">
                Success Response
              </h3>
              <pre className="overflow-auto rounded bg-green-100 p-4 text-xs text-green-900">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Response */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="mb-3 font-semibold text-red-900">
                Error Response
              </h3>
              <pre className="overflow-auto rounded bg-red-100 p-4 text-xs text-red-900">
                {error}
              </pre>
            </div>
          )}
        </div>

        {/* Interceptor Features */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-yellow-900">
            Interceptor Features
          </h2>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Request Interceptor:</strong> Add auth tokens, modify headers
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Response Interceptor:</strong> Transform errors automatically
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Error Transformation:</strong> Server errors → {'{'}message, recovery_suggestion, code{'}'}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Network Errors:</strong> Detect and provide helpful messages
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Timeout Handling:</strong> 10-second timeout with specific error
              </span>
            </li>
          </ul>
        </div>

        {/* Configuration */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-blue-900">
            API Configuration
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Base URL:</strong> {'{'}import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'{'}'}
            </p>
            <p>
              <strong>Timeout:</strong> 10 seconds
            </p>
            <p>
              <strong>Content-Type:</strong> application/json
            </p>
            <p>
              <strong>Error Codes:</strong> HTTP_*, NETWORK_ERROR, TIMEOUT_ERROR, UNKNOWN_ERROR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default APIClientDemo;
