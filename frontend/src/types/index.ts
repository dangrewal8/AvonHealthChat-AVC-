/**
 * TypeScript Type Definitions
 *
 * Type definitions for the Avon Health RAG frontend application.
 *
 * Tech Stack: React 18+ + TypeScript
 */

/**
 * Structured Extraction
 *
 * Extracted structured data from medical records
 */
export interface StructuredExtraction {
  type: 'medication' | 'condition' | 'procedure' | 'measurement' | 'date' | 'patient_info' | 'demographic';
  value: string;
  relevance: number; // How relevant to the query
  confidence: number; // How confident in the extraction
  source_artifact_id: string;
  supporting_text?: string; // The text that supports this extraction
}

/**
 * Formatted Provenance
 *
 * Citation/provenance information for answers
 */
export interface FormattedProvenance {
  artifact_id: string;
  artifact_type: 'care_plan' | 'medication' | 'note';
  title?: string;
  snippet: string;
  supporting_content?: string; // The actual text that supports the answer
  occurred_at: string;
  relevance_score: number;
  char_offsets?: [number, number];
  source_url: string;
}

/**
 * Confidence Score
 *
 * Confidence metrics for the response
 */
export interface ConfidenceScore {
  overall: number; // 0-1
  breakdown: {
    retrieval: number;
    reasoning: number;
    extraction: number;
  };
  explanation: string;
}

/**
 * Response Metadata
 *
 * Metadata about the query and response
 */
export interface ResponseMetadata {
  patient_id: string;
  query_time: string;
  processing_time_ms: number;
  artifacts_searched: number;
  chunks_retrieved: number;
  detail_level: number;
}

/**
 * UI Response
 *
 * Complete response structure from the API
 */
export interface UIResponse {
  query_id: string;
  short_answer: string;
  detailed_summary: string;
  structured_extractions: StructuredExtraction[];
  provenance: FormattedProvenance[];
  confidence: ConfidenceScore;
  metadata: ResponseMetadata;
}

/**
 * Conversation Message for context
 *
 * Priority 3: Enables follow-up question support
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/**
 * Query Request
 *
 * Request structure for querying the API
 */
export interface QueryRequest {
  query: string;
  patient_id: string;
  options?: QueryOptions;
  conversation_history?: ConversationMessage[]; // Priority 3: For follow-up questions
}

/**
 * Query Options
 *
 * Optional parameters for query
 */
export interface QueryOptions {
  detail_level?: number; // 1-5
  max_results?: number; // default 10
}

/**
 * Query History Item
 *
 * Single item in query history
 */
export interface QueryHistoryItem {
  query_id: string;
  query: string;
  patient_id: string;
  short_answer: string;
  timestamp: string;
  processing_time_ms: number;
}

/**
 * API Error Response
 *
 * Error structure from the API
 */
export interface APIError {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
}

/**
 * Loading State
 *
 * UI loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
