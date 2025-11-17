/**
 * API Request/Response Type Definitions
 * Complete type definitions for all API endpoints
 */

// ============================================================================
// Query API Types
// ============================================================================

/**
 * Conversation Message for context (Priority 3)
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface QueryRequest {
  query: string; // max 500 chars
  patient_id: string;
  options?: QueryOptions;
  conversation_history?: ConversationMessage[]; // Priority 3: For follow-up questions
}

export interface QueryOptions {
  detail_level?: number; // 1-5
  max_results?: number; // default 10
}

export interface QueryResponse {
  query_id: string;
  short_answer: string;
  detailed_summary: string;
  structured_extractions: StructuredExtraction[];
  provenance: FormattedProvenance[];
  confidence: ConfidenceScore;
  metadata: QueryMetadata;
  audit: AuditInfo;
}

export interface StructuredExtraction {
  type: 'medication' | 'condition' | 'procedure' | 'measurement' | 'date' | 'patient_info' | 'demographic';
  value: string;
  relevance: number; // How relevant to the query
  confidence: number; // How confident in the extraction
  source_artifact_id: string;
  supporting_text: string; // The text that supports this extraction (required for proper deduplication)
}

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

export interface ConfidenceScore {
  overall: number; // 0-1
  breakdown: {
    retrieval: number;
    reasoning: number;
    extraction: number;
  };
  explanation: string;
}

export interface QueryMetadata {
  patient_id: string;
  query_time: string;
  processing_time_ms: number;
  artifacts_searched: number;
  chunks_retrieved: number;
  detail_level: number;
}

export interface AuditInfo {
  query_id: string;
  timestamp: string;
  user_id?: string;
  session_id?: string;
}

// ============================================================================
// Recent Queries Types
// ============================================================================

export interface RecentQueriesRequest {
  patient_id: string;
  limit?: number; // default 10
}

export interface RecentQueriesResponse {
  queries: QueryHistoryItem[];
  total_count: number;
}

export interface QueryHistoryItem {
  query_id: string;
  query: string;
  patient_id: string;
  short_answer: string;
  timestamp: string;
  processing_time_ms: number;
}

// ============================================================================
// Indexing API Types
// ============================================================================

export interface IndexPatientRequest {
  force_reindex?: boolean; // default false
}

export interface IndexPatientResponse {
  success: boolean;
  patient_id: string;
  indexed_count: number;
  byType: {
    notes: number;
    documents: number;
    medications: number;
    conditions: number;
    allergies: number;
    care_plans: number;
    form_responses: number;
    messages: number;
    lab_observations: number;
    vitals: number;
    appointments: number;
    superbills: number;
    insurance_policies: number;
    tasks: number;
    family_histories: number;
    intake_flows: number;
    forms: number;
  };
  chunks_created: number;
  processing_time_ms: number;
  message: string;
}

export interface ClearIndexResponse {
  success: boolean;
  patient_id: string;
  message: string;
}

// ============================================================================
// Health & Metrics Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  version: string;
  services: ServiceHealthStatus;
}

export interface ServiceHealthStatus {
  database?: {
    status: 'up' | 'down';
    latency_ms?: number;
  };
  vector_store?: {
    status: 'up' | 'down';
    latency_ms?: number;
  };
  avon_api?: {
    status: 'up' | 'down';
    latency_ms?: number;
  };
  ollama_api?: {
    status: 'up' | 'down';
    latency_ms?: number;
  };
}

export interface MetricsResponse {
  timestamp: string;
  uptime_seconds: number;
  requests: RequestMetrics;
  cache: CacheMetrics;
  performance: PerformanceMetrics;
}

export interface RequestMetrics {
  total: number;
  by_endpoint: Record<string, number>;
  by_status: Record<number, number>;
  average_response_time_ms: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hit_rate: number;
  size: number;
  evictions: number;
}

export interface PerformanceMetrics {
  average_query_time_ms: number;
  average_retrieval_time_ms: number;
  average_generation_time_ms: number;
  p95_query_time_ms: number;
  p99_query_time_ms: number;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
}

// ============================================================================
// Standard API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}
