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

export interface CarePlan {
  id: string;
  patient_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  provider: string;
  goals?: string[];
  interventions?: string[];
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribed_date: string;
  prescriber: string;
  status: string;
  instructions?: string;
  side_effects?: string[];
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  note_type: string;
  content: string;
  author: string;
  created_at: string;
  encounter_id?: string;
  diagnoses?: string[];
  symptoms?: string[];
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
