-- Migration 005: Hallucination Prevention & Quality Assurance Schema
-- Phase 9: Conversation history, grounding verification, consistency checking, confidence metrics
-- Date: 2025-11-16

-- ==============================================================================
-- Table 1: conversation_history
-- Stores all queries and responses with quality metrics for analysis
-- ==============================================================================

CREATE TABLE IF NOT EXISTS conversation_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,

  -- Query details
  query TEXT NOT NULL,
  query_intent TEXT,
  query_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Response details
  short_answer TEXT NOT NULL,
  detailed_summary TEXT NOT NULL,
  model_used TEXT NOT NULL,

  -- Extraction & sources (JSONB for flexibility)
  extractions JSONB NOT NULL,           -- Array of Extraction objects
  sources JSONB NOT NULL,               -- Array of source artifacts
  retrieval_candidates JSONB,           -- Retrieved chunks for reference

  -- Quality metrics (Phase 9)
  grounding_score DECIMAL(3,2),         -- 0.00-1.00
  consistency_score DECIMAL(3,2),       -- 0.00-1.00
  confidence_score DECIMAL(3,2),        -- 0.00-1.00
  hallucination_risk DECIMAL(3,2),      -- 0.00-1.00
  overall_quality_score DECIMAL(3,2),   -- Weighted combination

  -- Feature flags at time of query
  enrichment_enabled BOOLEAN DEFAULT false,
  multi_hop_enabled BOOLEAN DEFAULT false,
  reasoning_enabled BOOLEAN DEFAULT false,

  -- Performance metrics
  execution_time_ms INTEGER,
  retrieval_time_ms INTEGER,
  generation_time_ms INTEGER,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for conversation_history
CREATE INDEX IF NOT EXISTS idx_conversation_patient
  ON conversation_history(patient_id);

CREATE INDEX IF NOT EXISTS idx_conversation_timestamp
  ON conversation_history(query_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_quality
  ON conversation_history(grounding_score, consistency_score, confidence_score);

CREATE INDEX IF NOT EXISTS idx_conversation_hallucination_risk
  ON conversation_history(hallucination_risk)
  WHERE hallucination_risk > 0.3;

-- GIN index for JSONB columns (fast search)
CREATE INDEX IF NOT EXISTS idx_conversation_extractions
  ON conversation_history USING GIN(extractions);

CREATE INDEX IF NOT EXISTS idx_conversation_sources
  ON conversation_history USING GIN(sources);

-- Full-text search on queries
CREATE INDEX IF NOT EXISTS idx_conversation_query_text
  ON conversation_history USING GIN(to_tsvector('english', query));

COMMENT ON TABLE conversation_history IS 'Phase 9: Stores all patient queries and responses with quality metrics for hallucination prevention and reasoning reference';

-- ==============================================================================
-- Table 2: grounding_verification
-- Stores fact-level verification results for answer grounding
-- ==============================================================================

CREATE TABLE IF NOT EXISTS grounding_verification (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,

  -- Atomic fact from response
  statement TEXT NOT NULL,
  statement_index INTEGER NOT NULL,

  -- Source verification
  is_grounded BOOLEAN NOT NULL,
  source_chunk_id TEXT,
  source_artifact_id TEXT,
  source_text TEXT,
  supporting_evidence TEXT,

  -- Scoring
  grounding_confidence DECIMAL(3,2) NOT NULL,  -- 0.00-1.00
  verification_method TEXT NOT NULL,           -- 'exact_match' | 'semantic_match' | 'inference' | 'unsupported'
  similarity_score DECIMAL(3,2),               -- For semantic matches

  -- Metadata
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_grounding_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversation_history(id)
    ON DELETE CASCADE
);

-- Indexes for grounding_verification
CREATE INDEX IF NOT EXISTS idx_grounding_conversation
  ON grounding_verification(conversation_id);

CREATE INDEX IF NOT EXISTS idx_grounding_unsupported
  ON grounding_verification(is_grounded)
  WHERE is_grounded = false;

CREATE INDEX IF NOT EXISTS idx_grounding_low_confidence
  ON grounding_verification(grounding_confidence)
  WHERE grounding_confidence < 0.7;

CREATE INDEX IF NOT EXISTS idx_grounding_method
  ON grounding_verification(verification_method);

COMMENT ON TABLE grounding_verification IS 'Phase 9: Fact-level verification to ensure all response statements are grounded in source material';

-- ==============================================================================
-- Table 3: consistency_checks
-- Stores cross-query consistency validation results
-- ==============================================================================

CREATE TABLE IF NOT EXISTS consistency_checks (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  current_conversation_id TEXT NOT NULL,
  previous_conversation_id TEXT,

  -- Consistency details
  check_type TEXT NOT NULL,  -- 'entity_consistency' | 'temporal_consistency' | 'semantic_consistency'
  is_consistent BOOLEAN NOT NULL,
  inconsistency_description TEXT,

  -- Conflicting information
  current_statement TEXT,
  previous_statement TEXT,
  conflict_severity TEXT,    -- 'low' | 'medium' | 'high' | 'critical'

  -- Entity tracking (for entity_consistency checks)
  entity_type TEXT,          -- 'medication' | 'condition' | 'allergy' | etc.
  entity_value TEXT,         -- Actual entity (e.g., "Atorvastatin")

  -- Scoring
  consistency_score DECIMAL(3,2) NOT NULL,

  -- Metadata
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_consistency_current_conv
    FOREIGN KEY (current_conversation_id)
    REFERENCES conversation_history(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_consistency_previous_conv
    FOREIGN KEY (previous_conversation_id)
    REFERENCES conversation_history(id)
    ON DELETE SET NULL
);

-- Indexes for consistency_checks
CREATE INDEX IF NOT EXISTS idx_consistency_patient
  ON consistency_checks(patient_id);

CREATE INDEX IF NOT EXISTS idx_consistency_current
  ON consistency_checks(current_conversation_id);

CREATE INDEX IF NOT EXISTS idx_consistency_issues
  ON consistency_checks(is_consistent)
  WHERE is_consistent = false;

CREATE INDEX IF NOT EXISTS idx_consistency_severity
  ON consistency_checks(conflict_severity)
  WHERE conflict_severity IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_consistency_entity
  ON consistency_checks(entity_type, entity_value);

COMMENT ON TABLE consistency_checks IS 'Phase 9: Cross-query consistency validation to detect contradictions across patient conversations';

-- ==============================================================================
-- Table 4: confidence_metrics
-- Stores confidence scores and uncertainty quantification
-- ==============================================================================

CREATE TABLE IF NOT EXISTS confidence_metrics (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  extraction_index INTEGER,  -- NULL for overall answer confidence

  -- Confidence breakdown
  retrieval_confidence DECIMAL(3,2),      -- Based on similarity scores
  source_confidence DECIMAL(3,2),         -- Based on source type/quality
  extraction_confidence DECIMAL(3,2),     -- Based on LLM confidence (temperature inverse)
  consistency_confidence DECIMAL(3,2),    -- Based on cross-query consistency
  aggregate_confidence DECIMAL(3,2) NOT NULL,  -- Overall confidence

  -- Uncertainty quantification
  uncertainty_level TEXT NOT NULL,  -- 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  uncertainty_explanation TEXT,
  recommendation TEXT,              -- e.g., "High confidence" | "Verify source" | "Consult provider"

  -- Contributing factors
  low_confidence_reasons TEXT[],    -- Array of reasons for low confidence

  -- Metadata
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_confidence_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversation_history(id)
    ON DELETE CASCADE
);

-- Indexes for confidence_metrics
CREATE INDEX IF NOT EXISTS idx_confidence_conversation
  ON confidence_metrics(conversation_id);

CREATE INDEX IF NOT EXISTS idx_confidence_low
  ON confidence_metrics(aggregate_confidence)
  WHERE aggregate_confidence < 0.7;

CREATE INDEX IF NOT EXISTS idx_confidence_uncertainty
  ON confidence_metrics(uncertainty_level)
  WHERE uncertainty_level IN ('high', 'very_high');

COMMENT ON TABLE confidence_metrics IS 'Phase 9: Confidence scoring and uncertainty quantification for extractions and answers';

-- ==============================================================================
-- Table 5: hallucination_detections
-- Stores hallucination detection results (multi-response variance)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS hallucination_detections (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,

  -- Detection method
  detection_method TEXT NOT NULL,  -- 'multi_response' | 'semantic_drift' | 'factual_inconsistency'

  -- Multi-response variance (SelfCheckGPT approach)
  sample_responses JSONB,           -- Array of generated responses for comparison
  num_samples INTEGER,
  variance_score DECIMAL(3,2),      -- 0.00-1.00 (higher = more variance = higher risk)

  -- Risk assessment
  hallucination_detected BOOLEAN NOT NULL,
  risk_level TEXT NOT NULL,         -- 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  risk_score DECIMAL(3,2) NOT NULL, -- 0.00-1.00

  -- Contributing factors
  contributing_factors TEXT[],
  inconsistent_statements TEXT[],

  -- Recommendation
  recommendation TEXT NOT NULL,

  -- Metadata
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_hallucination_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversation_history(id)
    ON DELETE CASCADE
);

-- Indexes for hallucination_detections
CREATE INDEX IF NOT EXISTS idx_hallucination_conversation
  ON hallucination_detections(conversation_id);

CREATE INDEX IF NOT EXISTS idx_hallucination_detected
  ON hallucination_detections(hallucination_detected)
  WHERE hallucination_detected = true;

CREATE INDEX IF NOT EXISTS idx_hallucination_high_risk
  ON hallucination_detections(risk_level)
  WHERE risk_level IN ('high', 'very_high');

COMMENT ON TABLE hallucination_detections IS 'Phase 9: Hallucination detection using multi-response variance and consistency checks';

-- ==============================================================================
-- Table 6: quality_trends
-- Aggregated quality metrics over time for monitoring
-- ==============================================================================

CREATE TABLE IF NOT EXISTS quality_trends (
  id TEXT PRIMARY KEY,
  patient_id TEXT,              -- NULL for system-wide trends
  time_period TEXT NOT NULL,    -- 'hour' | 'day' | 'week' | 'month'
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Aggregated metrics
  total_queries INTEGER NOT NULL DEFAULT 0,
  avg_grounding_score DECIMAL(3,2),
  avg_consistency_score DECIMAL(3,2),
  avg_confidence_score DECIMAL(3,2),
  avg_hallucination_risk DECIMAL(3,2),
  avg_overall_quality DECIMAL(3,2),

  -- Counts
  low_grounding_count INTEGER DEFAULT 0,      -- grounding < 0.7
  inconsistent_count INTEGER DEFAULT 0,       -- consistency < 0.8
  low_confidence_count INTEGER DEFAULT 0,     -- confidence < 0.6
  high_hallucination_count INTEGER DEFAULT 0, -- risk > 0.3

  -- Performance
  avg_execution_time_ms INTEGER,
  p95_execution_time_ms INTEGER,

  -- Metadata
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(patient_id, time_period, period_start)
);

-- Indexes for quality_trends
CREATE INDEX IF NOT EXISTS idx_quality_trends_patient
  ON quality_trends(patient_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_quality_trends_period
  ON quality_trends(time_period, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_quality_trends_quality
  ON quality_trends(avg_overall_quality)
  WHERE avg_overall_quality < 0.8;

COMMENT ON TABLE quality_trends IS 'Phase 9: Aggregated quality metrics over time for monitoring and alerting';

-- ==============================================================================
-- Trigger: Update updated_at timestamp
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_history_updated_at
  BEFORE UPDATE ON conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Migration Complete
-- ==============================================================================

COMMENT ON SCHEMA public IS 'Phase 9 hallucination prevention schema added - 6 tables for conversation history, grounding verification, consistency checking, confidence metrics, hallucination detection, and quality trends';
