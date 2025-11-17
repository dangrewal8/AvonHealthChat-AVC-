/**
 * Phase 9: Hallucination Prevention & Quality Assurance Type Definitions
 *
 * Comprehensive types for conversation history, grounding verification,
 * consistency checking, confidence metrics, and hallucination detection.
 *
 * Tech Stack: TypeScript strict mode, PostgreSQL storage
 */

import { Extraction } from '../services/extraction-prompt-builder.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';

// ==============================================================================
// Conversation History Types
// ==============================================================================

/**
 * Complete conversation record stored in database
 */
export interface ConversationRecord {
  id: string;
  patient_id: string;

  // Query details
  query: string;
  query_intent: string | null;
  query_timestamp: Date;

  // Response details
  short_answer: string;
  detailed_summary: string;
  model_used: string;

  // Extraction & sources
  extractions: Extraction[];
  sources: SourceReference[];
  retrieval_candidates?: RetrievalCandidate[];

  // Quality metrics
  grounding_score?: number;
  consistency_score?: number;
  confidence_score?: number;
  hallucination_risk?: number;
  overall_quality_score?: number;

  // Feature flags at time of query
  enrichment_enabled: boolean;
  multi_hop_enabled: boolean;
  reasoning_enabled: boolean;

  // Performance metrics
  execution_time_ms?: number;
  retrieval_time_ms?: number;
  generation_time_ms?: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Source reference for conversation history
 */
export interface SourceReference {
  artifact_id: string;
  artifact_type: string;
  chunk_id?: string;
  text: string;
  relevance_score?: number;
}

/**
 * Quality trends over time
 */
export interface QualityTrends {
  patient_id: string | null;
  time_period: 'hour' | 'day' | 'week' | 'month';
  period_start: Date;
  period_end: Date;

  total_queries: number;
  avg_grounding_score: number;
  avg_consistency_score: number;
  avg_confidence_score: number;
  avg_hallucination_risk: number;
  avg_overall_quality: number;

  low_grounding_count: number;
  inconsistent_count: number;
  low_confidence_count: number;
  high_hallucination_count: number;

  avg_execution_time_ms: number;
  p95_execution_time_ms: number;
}

// ==============================================================================
// Grounding Verification Types
// ==============================================================================

/**
 * Verification method for statement grounding
 */
export type VerificationMethod =
  | 'exact_match'        // Exact text match found in source
  | 'semantic_match'     // Semantic similarity match
  | 'inference'          // Logical inference from source
  | 'unsupported';       // No support found

/**
 * Individual statement grounding result
 */
export interface StatementGrounding {
  statement: string;
  statement_index: number;
  is_grounded: boolean;
  source_chunk_id?: string;
  source_artifact_id?: string;
  source_text?: string;
  supporting_evidence?: string;
  grounding_confidence: number;       // 0.0-1.0
  verification_method: VerificationMethod;
  similarity_score?: number;          // For semantic matches
}

/**
 * Complete grounding verification result
 */
export interface GroundingResult {
  conversation_id: string;
  overall_grounded: boolean;
  grounding_score: number;            // 0.0-1.0
  statements: StatementGrounding[];
  unsupported_statements: string[];
  warnings: string[];
  verified_at: Date;
}

/**
 * Grounding verification record (database model)
 */
export interface GroundingVerificationRecord {
  id: string;
  conversation_id: string;
  statement: string;
  statement_index: number;
  is_grounded: boolean;
  source_chunk_id: string | null;
  source_artifact_id: string | null;
  source_text: string | null;
  supporting_evidence: string | null;
  grounding_confidence: number;
  verification_method: VerificationMethod;
  similarity_score: number | null;
  verified_at: Date;
}

// ==============================================================================
// Consistency Checking Types
// ==============================================================================

/**
 * Type of consistency check
 */
export type ConsistencyCheckType =
  | 'entity_consistency'      // Same entity should have consistent attributes
  | 'temporal_consistency'    // Time-based consistency (e.g., discontinued meds)
  | 'semantic_consistency';   // Semantic meaning should be consistent

/**
 * Severity level for inconsistencies
 */
export type ConflictSeverity =
  | 'low'                     // Minor discrepancy, low impact
  | 'medium'                  // Noticeable discrepancy
  | 'high'                    // Significant contradiction
  | 'critical';               // Critical contradiction requiring immediate review

/**
 * Individual contradiction found
 */
export interface Contradiction {
  current_statement: string;
  previous_statement: string;
  previous_conversation_id: string;
  previous_query: string;
  previous_timestamp: Date;
  severity: ConflictSeverity;
  explanation: string;
  entity_type?: string;
  entity_value?: string;
}

/**
 * Consistency checking result
 */
export interface ConsistencyResult {
  conversation_id: string;
  patient_id: string;
  is_consistent: boolean;
  consistency_score: number;          // 0.0-1.0
  contradictions: Contradiction[];
  warnings: string[];
  checked_at: Date;
}

/**
 * Consistency check record (database model)
 */
export interface ConsistencyCheckRecord {
  id: string;
  patient_id: string;
  current_conversation_id: string;
  previous_conversation_id: string | null;
  check_type: ConsistencyCheckType;
  is_consistent: boolean;
  inconsistency_description: string | null;
  current_statement: string | null;
  previous_statement: string | null;
  conflict_severity: ConflictSeverity | null;
  entity_type: string | null;
  entity_value: string | null;
  consistency_score: number;
  checked_at: Date;
}

/**
 * Entity history for tracking changes
 */
export interface EntityHistory {
  entity_type: string;
  entity_value: string;
  conversation_id: string;
  query: string;
  timestamp: Date;
  context: string;                    // Surrounding context where entity appeared
  status?: 'active' | 'discontinued' | 'changed';
}

// ==============================================================================
// Confidence Metrics Types
// ==============================================================================

/**
 * Uncertainty level categorization
 */
export type UncertaintyLevel =
  | 'very_low'                        // Very confident (>0.9)
  | 'low'                             // Confident (0.8-0.9)
  | 'medium'                          // Moderate confidence (0.6-0.8)
  | 'high'                            // Low confidence (0.4-0.6)
  | 'very_high';                      // Very low confidence (<0.4)

/**
 * Multi-factor confidence score
 */
export interface ConfidenceScore {
  retrieval_confidence: number;       // Based on similarity score (0.0-1.0)
  source_confidence: number;          // Based on source type/quality (0.0-1.0)
  extraction_confidence: number;      // Based on LLM confidence (0.0-1.0)
  consistency_confidence: number;     // Based on history consistency (0.0-1.0)
  aggregate_confidence: number;       // Weighted average (0.0-1.0)
}

/**
 * Aggregate confidence with recommendations
 */
export interface AggregateConfidence {
  overall_confidence: number;         // 0.0-1.0
  confidence_breakdown: ConfidenceScore[];
  uncertainty_level: UncertaintyLevel;
  uncertainty_explanation: string;
  recommendation: string;             // "High confidence" | "Verify source" | "Consult provider"
  low_confidence_reasons: string[];
}

/**
 * Confidence metrics record (database model)
 */
export interface ConfidenceMetricsRecord {
  id: string;
  conversation_id: string;
  extraction_index: number | null;    // NULL for overall answer confidence
  retrieval_confidence: number | null;
  source_confidence: number | null;
  extraction_confidence: number | null;
  consistency_confidence: number | null;
  aggregate_confidence: number;
  uncertainty_level: UncertaintyLevel;
  uncertainty_explanation: string | null;
  recommendation: string | null;
  low_confidence_reasons: string[];
  calculated_at: Date;
}

// ==============================================================================
// Hallucination Detection Types
// ==============================================================================

/**
 * Hallucination detection method
 */
export type DetectionMethod =
  | 'multi_response'                  // SelfCheckGPT: variance across responses
  | 'semantic_drift'                  // Semantic drift from source
  | 'factual_inconsistency';          // Factual inconsistency with source

/**
 * Risk level for hallucination
 */
export type RiskLevel =
  | 'very_low'                        // <0.1
  | 'low'                             // 0.1-0.2
  | 'medium'                          // 0.2-0.4
  | 'high'                            // 0.4-0.7
  | 'very_high';                      // >0.7

/**
 * Hallucination risk assessment
 */
export interface HallucinationRisk {
  conversation_id: string;
  detection_method: DetectionMethod;
  hallucination_detected: boolean;
  risk_level: RiskLevel;
  risk_score: number;                 // 0.0-1.0
  contributing_factors: string[];
  inconsistent_statements?: string[];
  recommendation: string;
  detected_at: Date;
}

/**
 * Multi-response variance detection
 */
export interface MultiResponseDetection {
  sample_responses: string[];
  num_samples: number;
  variance_score: number;             // 0.0-1.0 (higher = more variance)
  semantic_consistency: number;       // 0.0-1.0 (higher = more consistent)
  hallucination_detected: boolean;
}

/**
 * Hallucination detection record (database model)
 */
export interface HallucinationDetectionRecord {
  id: string;
  conversation_id: string;
  detection_method: DetectionMethod;
  sample_responses: string[] | null;
  num_samples: number | null;
  variance_score: number | null;
  hallucination_detected: boolean;
  risk_level: RiskLevel;
  risk_score: number;
  contributing_factors: string[];
  inconsistent_statements: string[];
  recommendation: string;
  detected_at: Date;
}

// ==============================================================================
// Quality Metrics Types
// ==============================================================================

/**
 * Comprehensive quality metrics for a conversation
 */
export interface QualityMetrics {
  conversation_id: string;
  grounding_score: number;            // 0.0-1.0
  consistency_score: number;          // 0.0-1.0
  confidence_score: number;           // 0.0-1.0
  hallucination_risk: number;         // 0.0-1.0
  overall_quality_score: number;      // 0.0-1.0 (weighted combination)
  quality_grade: QualityGrade;
}

/**
 * Quality grade categorization
 */
export type QualityGrade =
  | 'excellent'                       // >0.9
  | 'good'                            // 0.8-0.9
  | 'acceptable'                      // 0.7-0.8
  | 'poor'                            // 0.5-0.7
  | 'unacceptable';                   // <0.5

/**
 * Quality report for a conversation
 */
export interface QualityReport {
  conversation_id: string;
  patient_id: string;
  query: string;
  query_timestamp: Date;

  // Metrics
  quality_metrics: QualityMetrics;
  grounding_result: GroundingResult;
  consistency_result: ConsistencyResult;
  confidence_metrics: AggregateConfidence;
  hallucination_risk: HallucinationRisk;

  // Summary
  passed_quality_checks: boolean;
  warnings: string[];
  recommendations: string[];

  // Generated at
  generated_at: Date;
}

// ==============================================================================
// Service Configuration Types
// ==============================================================================

/**
 * Phase 9 feature flags
 */
export interface Phase9Config {
  enable_conversation_history: boolean;
  enable_grounding_verification: boolean;
  enable_consistency_checking: boolean;
  enable_confidence_calibration: boolean;
  enable_hallucination_detection: boolean;

  // Thresholds
  grounding_score_threshold: number;        // Default: 0.7
  consistency_score_threshold: number;      // Default: 0.8
  confidence_score_threshold: number;       // Default: 0.6
  hallucination_risk_threshold: number;     // Default: 0.3

  // Multi-response detection settings
  hallucination_detection_samples: number;  // Default: 3
  hallucination_detection_temp_range: number; // Default: 0.1
}

/**
 * Time range for trend analysis
 */
export interface TimeRange {
  start: Date;
  end: Date;
  period: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  service_name: string;
  is_healthy: boolean;
  last_check: Date;
  error_message?: string;
}

// ==============================================================================
// Export all types
// ==============================================================================

export type {
  // Re-export from other services for convenience
  Extraction,
  RetrievalCandidate,
};
