/**
 * TypeScript Type Definitions
 * Avon Health RAG System Backend
 */

// ============================================================================
// Request/Response Types
// ============================================================================

export interface QueryRequest {
  query: string;
  patient_id: string;
  options?: QueryOptions;
  conversation_history?: ConversationMessage[];
}

export interface QueryOptions {
  detail_level?: number; // 1-5 scale
  max_results?: number;  // Maximum number of sources to retrieve
  include_structured?: boolean; // Include structured extractions
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UIResponse {
  query_id: string;
  short_answer: string;
  detailed_summary: string;
  structured_extractions: StructuredExtraction[];
  provenance: FormattedProvenance[];
  confidence: ConfidenceScore;
  metadata: ResponseMetadata;
}

export interface StructuredExtraction {
  type: 'medication' | 'condition' | 'procedure' | 'measurement' | 'date' | 'patient_info' | 'demographic';
  value: string;
  relevance: number;
  confidence: number;
  source_artifact_id: string;
  supporting_text?: string;
}

export interface FormattedProvenance {
  artifact_id: string;
  artifact_type: 'care_plan' | 'medication' | 'note';
  snippet: string;
  occurred_at: string;
  relevance_score: number;
  char_offsets: [number, number];
  source_url: string;
}

export interface ConfidenceScore {
  overall: number;
  breakdown: {
    retrieval: number;
    reasoning: number;
    extraction: number;
  };
  explanation: string;
}

export interface ResponseMetadata {
  patient_id: string;
  query_time: string;
  processing_time_ms: number;
  artifacts_searched: number;
  chunks_retrieved: number;
  detail_level: number;
}

// ============================================================================
// Avon Health API Types
// ============================================================================

export interface AvonHealthCredentials {
  client_id: string;
  client_secret: string;
  base_url: string;
  account: string;
  user_id: string;
}

export interface AvonHealthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AvonHealthJWTRequest {
  account: string;
  user_id: string;
}

export interface AvonHealthJWTResponse {
  jwt_token: string;
  expires_in: number;
}

/**
 * Avon Health API Types - UPDATED to match actual API structure
 * These match the real fields returned by /v2/care_plans, /v2/medications, /v2/notes
 */

export interface CarePlan {
  id: string;
  object: string;
  patient: string;  // NOT patient_id
  score: number;
  care_plan_template: string;
  care_plan_template_version: string;
  name: string;  // NOT title
  share_with_patient: boolean;
  created_by: string;
  created_at: string;
  last_updated_at: string;  // NOT updated_at
  account: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  assigned_to: string;
  is_entered_in_error: boolean | null;
  external_id: string | null;
  entered_in_error: {
    marked_by: string;
    reason: string | null;
    marked_at: string | null;
  };
  request_signature_from: any[];
  sections: any[];  // Complex nested structure
  signers: any[];
  reviews: any[];
  comments: any[];
  addendums: any[];
  status_history: any[];
}

export interface Medication {
  id: string;
  object: string;
  patient: string;  // NOT patient_id
  source: string | null;
  name: string;
  strength: string;  // NOT dosage
  ndc: string | null;
  sig: string | null;  // Administration instructions (NOT frequency)
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  comment: string | null;
  created_by: string;
  created_at: string;
  last_updated_at: string;
  account: string;
  drug_id: string | null;
  quantity: string | null;
  dose_form: string | null;
  refills: number | null;
  last_filled_at: string | null;
  status: string | null;
  external_accounts: {
    dosespot?: string | null;
    [key: string]: any;
  };
}

export interface ClinicalNote {
  id: string;
  object: string;
  patient: string;  // NOT patient_id
  score: number;
  note_template: string;
  note_template_version: string;
  appointment: string | null;
  insurance_claim: string | null;
  name: string;  // Note name/title
  share_with_patient: boolean | null;
  created_by: string;  // NOT author
  created_at: string;
  last_updated_at: string;
  account: string;
  appointment_occurrence: string | null;
  is_entered_in_error: boolean | null;
  external_id: string | null;
  superbill: string | null;
  psychotherapy_note: boolean | null;
  appointment_required: boolean | null;
  entered_in_error: {
    marked_by: string;
    reason: string | null;
    marked_at: string | null;
  };
  sections: NoteSection[];  // Content is in sections/answers, NOT a simple string
}

export interface NoteSection {
  id: string;
  object: string;
  name: string;
  logic: any;
  answers: NoteAnswer[];
}

export interface NoteAnswer {
  id: string;
  type: string;
  name?: string;
  value?: any;
  score?: number;
  [key: string]: any;  // Various fields depending on answer type
}

// ============================================================================
// Vector Database Types
// ============================================================================

export interface VectorDocument {
  id: string;
  text: string;
  embedding?: number[];
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  patient_id: string;
  artifact_id: string;
  artifact_type: 'care_plan' | 'medication' | 'note';
  occurred_at: string;
  source_url: string;
  chunk_index?: number;
  total_chunks?: number;
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
  char_offsets?: [number, number];
}

// ============================================================================
// Ollama API Types
// ============================================================================

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OllamaGenerateResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  port: number;
  nodeEnv: string;
  avonHealth: AvonHealthCredentials;
  ollama: {
    baseUrl: string;
    embeddingModel: string;
    llmModel: string;
    maxTokens: number;
    temperature: number;
  };
  vectorDb: {
    type: 'faiss' | 'chromadb';
    dimension: number;
    indexPath: string;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
