/**
 * StreamingSearch Demo
 *
 * Interactive demonstration of Server-Sent Events (SSE) streaming with real-time progress.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import React, { useState } from 'react';
import { StreamingSearch } from './StreamingSearch';
import { useStreamingQuery, STAGE_INFO } from '../hooks/useStreamingQuery';
import { Zap, Code, Info } from 'lucide-react';

/**
 * Sample queries for demonstration
 */
const SAMPLE_QUERIES = [
  'What medications is the patient currently taking?',
  'What is the patient\'s most recent diagnosis?',
  'When was the patient\'s last appointment?',
  'Does the patient have any allergies?',
  'What procedures has the patient undergone?',
];

/**
 * Basic Streaming Example
 *
 * Minimal example showing hook usage
 */
export function BasicStreamingExample() {
  const [query, setQuery] = useState('');
  const { startStream, isStreaming, updates, finalResult, error } = useStreamingQuery();

  const handleSearch = () => {
    startStream(query, 'patient-123', { detail_level: 3 });
  };

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <h2 className="text-xl font-bold text-blue-900">Basic Hook Example</h2>

      <div className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter query..."
          className="flex-1 rounded border p-2"
          disabled={isStreaming}
        />
        <button
          onClick={handleSearch}
          disabled={isStreaming || !query}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isStreaming ? 'Processing...' : 'Search'}
        </button>
      </div>

      {/* Progress Updates */}
      {updates.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-900">Progress Updates:</h3>
          <div className="max-h-40 space-y-1 overflow-auto">
            {updates.map((update, i) => (
              <div key={i} className="rounded bg-blue-100 p-2 text-sm text-blue-900">
                <span className="font-medium">{STAGE_INFO[update.stage]?.name || update.stage}:</span>{' '}
                {update.status || 'processing'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Final Result */}
      {finalResult && (
        <div className="rounded border border-green-300 bg-green-50 p-3 text-green-900">
          <strong>Answer:</strong> {finalResult.short_answer}
        </div>
      )}
    </div>
  );
}

/**
 * Progress Indicator Example
 *
 * Shows custom progress visualization
 */
export function ProgressIndicatorExample() {
  const { startStream, isStreaming, progress, currentStage } = useStreamingQuery();

  const handleQuickTest = () => {
    startStream('Test query for progress visualization', 'patient-123');
  };

  return (
    <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6">
      <h2 className="text-xl font-bold text-green-900">Progress Indicator Example</h2>

      <button
        onClick={handleQuickTest}
        disabled={isStreaming}
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-300"
      >
        {isStreaming ? 'Processing...' : 'Start Test'}
      </button>

      {/* Progress Bar */}
      {isStreaming && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-green-900">
            <span className="font-medium">
              {currentStage ? STAGE_INFO[currentStage]?.name : 'Starting...'}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-4 overflow-hidden rounded-full bg-green-200">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sample Queries Example
 *
 * Demonstrates quick query selection
 */
export function SampleQueriesExample() {
  const [selectedQuery, setSelectedQuery] = useState('');
  const { startStream, isStreaming, updates } = useStreamingQuery();

  const handleQueryClick = (query: string) => {
    setSelectedQuery(query);
    startStream(query, 'patient-123', { detail_level: 3 });
  };

  return (
    <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-6">
      <h2 className="text-xl font-bold text-purple-900">Sample Queries</h2>

      <div className="space-y-2">
        {SAMPLE_QUERIES.map((query, index) => (
          <button
            key={index}
            onClick={() => handleQueryClick(query)}
            disabled={isStreaming}
            className={`w-full rounded border p-3 text-left transition-colors ${
              selectedQuery === query
                ? 'border-purple-400 bg-purple-100 text-purple-900'
                : 'border-purple-200 bg-white text-purple-700 hover:bg-purple-50'
            } disabled:opacity-50`}
          >
            {query}
          </button>
        ))}
      </div>

      {/* Latest Update */}
      {updates.length > 0 && (
        <div className="rounded bg-purple-100 p-3 text-sm text-purple-900">
          <strong>Latest:</strong>{' '}
          {STAGE_INFO[updates[updates.length - 1].stage]?.name || 'Processing...'}
        </div>
      )}
    </div>
  );
}

/**
 * Main Demo Component
 *
 * Comprehensive demonstration of all streaming features
 */
export function StreamingSearchDemo() {
  const [activeTab, setActiveTab] = useState<'full' | 'basic' | 'progress' | 'samples'>('full');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <Zap className="text-blue-500" size={32} />
            <h1 className="text-4xl font-bold text-gray-900">
              Streaming Search Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Server-Sent Events (SSE) with Real-Time Progress Updates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('full')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeTab === 'full'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Full Component
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Basic Hook
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Progress Bar
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                activeTab === 'samples'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sample Queries
            </button>
          </div>
        </div>

        {/* Active Demo */}
        <div className="mb-8">
          {activeTab === 'full' && <StreamingSearch autoFocus={true} />}
          {activeTab === 'basic' && <BasicStreamingExample />}
          {activeTab === 'progress' && <ProgressIndicatorExample />}
          {activeTab === 'samples' && <SampleQueriesExample />}
        </div>

        {/* Features Section */}
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Zap className="text-yellow-600" size={24} />
            <h2 className="text-xl font-semibold text-yellow-900">
              Streaming Features
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Real-Time Updates:</strong> Live progress through 3 stages (Understanding → Retrieval → Generation)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Server-Sent Events:</strong> Efficient one-way streaming from server to client
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Progress Indicators:</strong> Visual feedback with percentage and stage names
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Error Handling:</strong> Graceful error states with retry functionality
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Cancellation:</strong> Ability to cancel in-progress streams
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">✓</span>
              <span>
                <strong>Stage Timing:</strong> Duration metrics for each processing stage
              </span>
            </li>
          </ul>
        </div>

        {/* Code Example */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center space-x-2">
            <Code className="text-gray-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Usage Example
            </h2>
          </div>

          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm text-gray-800">
{`// Import the hook
import { useStreamingQuery } from './hooks/useStreamingQuery';

// Use in component
const {
  startStream,
  isStreaming,
  updates,
  finalResult,
  error,
  progress
} = useStreamingQuery();

// Start streaming
const handleSearch = () => {
  startStream(query, patientId, {
    detail_level: 3,
    max_results: 5
  });
};

// Show progress
{updates.map(update => (
  <div>{update.stage}: {update.status}</div>
))}

// Show result
{finalResult && (
  <div>{finalResult.short_answer}</div>
)}`}
          </pre>
        </div>

        {/* Technical Info */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Info className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-blue-900">
              Technical Implementation
            </h2>
          </div>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Backend:</strong> Node.js + Express with Server-Sent Events (SSE)
            </p>
            <p>
              <strong>Frontend:</strong> React + TypeScript with Fetch API streaming
            </p>
            <p>
              <strong>Protocol:</strong> HTTP/1.1 with text/event-stream content type
            </p>
            <p>
              <strong>Stages:</strong> Query Understanding (800ms) → Retrieval (1200ms) → Generation (1500ms)
            </p>
            <p>
              <strong>Total Time:</strong> ~3.5 seconds with real-time progress updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamingSearchDemo;
