/**
 * ProvenanceCard Component
 *
 * Display provenance/citation information for a query result.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { FileText, Calendar, ExternalLink } from 'lucide-react';
import { FormattedProvenance } from '../types';

interface ProvenanceCardProps {
  provenance: FormattedProvenance;
  index: number;
}

export function ProvenanceCard({ provenance, index }: ProvenanceCardProps) {
  const typeColors = {
    care_plan: 'bg-blue-100 text-blue-800',
    medication: 'bg-green-100 text-green-800',
    note: 'bg-purple-100 text-purple-800',
  };

  const typeLabels = {
    care_plan: 'Care Plan',
    medication: 'Medication',
    note: 'Note',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {index}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              typeColors[provenance.artifact_type]
            }`}
          >
            {typeLabels[provenance.artifact_type]}
          </span>
        </div>
        <div className="flex items-center text-sm text-secondary">
          <Calendar className="mr-1 h-4 w-4" />
          {formatDate(provenance.occurred_at)}
        </div>
      </div>

      {/* Title */}
      {provenance.title && (
        <h3 className="mb-2 font-semibold text-gray-900">{provenance.title}</h3>
      )}

      {/* Snippet */}
      <p className="mb-3 text-sm text-gray-700 leading-relaxed">
        {provenance.snippet}
      </p>

      {/* Supporting Content - The actual text that supports the answer */}
      {provenance.supporting_content && provenance.supporting_content !== provenance.snippet && (
        <div className="mb-3 rounded bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <p className="text-xs font-semibold text-yellow-800 mb-1">Supporting Evidence:</p>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            "{provenance.supporting_content}"
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-secondary">
          <FileText className="mr-1 h-4 w-4" />
          <span>Relevance: {(provenance.relevance_score * 100).toFixed(0)}%</span>
        </div>
        <button
          onClick={() => {
            // For now, just show an alert with artifact ID
            // In production, this could link to actual EMR record
            alert(`Source: ${provenance.artifact_type}\nArtifact ID: ${provenance.artifact_id}\nDate: ${formatDate(provenance.occurred_at)}`);
          }}
          className="flex items-center text-primary hover:text-blue-700 hover:underline cursor-pointer"
        >
          View Source Info
          <ExternalLink className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ProvenanceCard;
