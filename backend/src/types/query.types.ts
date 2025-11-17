/**
 * Query Processing Types
 *
 * Type definitions for query understanding, intent classification, and entity extraction.
 *
 */

/**
 * Query Intent Classification
 */
export enum QueryIntent {
  RETRIEVE_MEDICATIONS = 'retrieve_medications',
  RETRIEVE_CARE_PLANS = 'retrieve_care_plans',
  RETRIEVE_NOTES = 'retrieve_notes',
  RETRIEVE_RECENT = 'retrieve_recent',
  SEARCH = 'search',
  SUMMARIZE = 'summarize',
  UNKNOWN = 'unknown',
}

/**
 * Extracted Entity
 */
export interface Entity {
  text: string;
  type: string;
  normalized: string;
  confidence: number;
}

/**
 * Temporal Filter
 */
export interface TemporalFilter {
  dateFrom: string; // ISO 8601 date
  dateTo: string; // ISO 8601 date
  timeReference: string; // e.g., "last 3 months"
  relativeType: 'days' | 'weeks' | 'months' | 'years';
  amount: number;
}

/**
 * UI Response format
 */
export interface UIResponse {
  short_answer: string;
  detailed_summary: string;
  provenance: Array<{
    artifact_id: string;
    snippet?: string;
    score?: number;
  }>;
  confidence: number;
  metadata: {
    detail_level: number;
    processing_time_ms: number;
    total_artifacts_searched: number;
    timestamp: string;
  };
}
