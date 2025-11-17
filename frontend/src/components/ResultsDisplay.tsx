/**
 * ResultsDisplay Component
 *
 * Display query results including answer, details, and provenance.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { UIResponse, StructuredExtraction } from '../types';
import { ProvenanceCard } from './ProvenanceCard';

interface ResultsDisplayProps {
  result: UIResponse;
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return Info;
    return AlertCircle;
  };

  const ConfidenceIcon = getConfidenceIcon(result.confidence.overall);

  return (
    <div className="space-y-6">
      {/* Short Answer */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Answer</h2>
          <div
            className={`flex items-center space-x-2 ${getConfidenceColor(
              result.confidence.overall
            )}`}
          >
            <ConfidenceIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {getConfidenceLabel(result.confidence.overall)} Confidence (
              {(result.confidence.overall * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
        <p className="text-lg text-gray-800 leading-relaxed">
          {result.short_answer}
        </p>
      </div>

      {/* Detailed Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Detailed Summary
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {result.detailed_summary}
        </p>
      </div>

      {/* Structured Extractions */}
      {result.structured_extractions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Key Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.structured_extractions.map((extraction, index) => (
              <ExtractionItem key={index} extraction={extraction} />
            ))}
          </div>
        </div>
      )}

      {/* Provenance/Sources */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Sources ({result.provenance.length})
        </h3>
        <div className="space-y-3">
          {result.provenance.map((prov, index) => (
            <ProvenanceCard key={prov.artifact_id} provenance={prov} index={index + 1} />
          ))}
        </div>
      </div>

      {/* Confidence Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Confidence Breakdown
        </h3>
        <div className="space-y-3">
          <ConfidenceBar
            label="Retrieval"
            value={result.confidence.breakdown.retrieval}
          />
          <ConfidenceBar
            label="Reasoning"
            value={result.confidence.breakdown.reasoning}
          />
          <ConfidenceBar
            label="Extraction"
            value={result.confidence.breakdown.extraction}
          />
        </div>
        <p className="mt-4 text-sm text-secondary">
          {result.confidence.explanation}
        </p>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <MetadataItem
            label="Processing Time"
            value={`${result.metadata.processing_time_ms}ms`}
          />
          <MetadataItem
            label="Artifacts Searched"
            value={result.metadata.artifacts_searched.toString()}
          />
          <MetadataItem
            label="Chunks Retrieved"
            value={result.metadata.chunks_retrieved.toString()}
          />
          <MetadataItem
            label="Detail Level"
            value={result.metadata.detail_level.toString()}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Extraction Item Component
 */
function ExtractionItem({ extraction }: { extraction: StructuredExtraction }) {
  const typeColors: Record<string, string> = {
    medication: 'bg-green-50 border-green-200 text-green-800',
    condition: 'bg-red-50 border-red-200 text-red-800',
    procedure: 'bg-blue-50 border-blue-200 text-blue-800',
    measurement: 'bg-purple-50 border-purple-200 text-purple-800',
    date: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    patient_info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    demographic: 'bg-pink-50 border-pink-200 text-pink-800',
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const formatValue = (value: string): string => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(value);

      // If it's a medication, format nicely
      if (typeof parsed === 'object' && parsed !== null) {
        const parts: string[] = [];

        if (parsed.name || parsed.medication) {
          parts.push(parsed.name || parsed.medication);
        }

        if (parsed.dosage) {
          parts.push(parsed.dosage);
        }

        if (parsed.form) {
          parts.push(`(${parsed.form})`);
        }

        return parts.join(' ');
      }

      return value;
    } catch {
      // If not JSON, return as-is
      return value;
    }
  };

  return (
    <div
      className={`rounded-md border p-3 ${typeColors[extraction.type] || 'bg-gray-50 border-gray-200 text-gray-800'}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide opacity-75">
        {formatType(extraction.type)}
      </div>
      <div className="mt-1 font-medium">{formatValue(extraction.value)}</div>
      <div className="mt-1 text-xs opacity-75">
        Relevance: {(extraction.relevance * 100).toFixed(0)}%
      </div>
      {extraction.supporting_text && (
        <div className="mt-2 text-xs italic opacity-60 border-t border-current pt-1">
          "{extraction.supporting_text.substring(0, 80)}{extraction.supporting_text.length > 80 ? '...' : ''}"
        </div>
      )}
    </div>
  );
}

/**
 * Confidence Bar Component
 */
function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const percentage = value * 100;
  const getColor = (val: number) => {
    if (val >= 0.8) return 'bg-green-500';
    if (val >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-secondary">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${getColor(value)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Metadata Item Component
 */
function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-secondary">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default ResultsDisplay;
