-- ============================================================================
-- Migration 002: Add Enrichment Schema
-- ============================================================================
-- Adds tables for clinical relationships, enriched artifacts, and entities
-- Safe to run incrementally (uses CREATE IF NOT EXISTS pattern)
-- ============================================================================

BEGIN;

-- ============================================================================
-- Clinical Relationships Table
-- ============================================================================
-- Stores relationships between clinical entities (medication → condition, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_relationships (
  -- Primary key
  relationship_id VARCHAR(255) PRIMARY KEY,

  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL,
  -- Values: 'medication_indication', 'procedure_diagnosis', 'care_plan_condition',
  --         'lab_condition', 'symptom_diagnosis', 'medication_interaction'

  -- Source entity (e.g., medication)
  source_artifact_id VARCHAR(255) NOT NULL,
  source_artifact_type VARCHAR(50) NOT NULL,
  source_entity_text TEXT,

  -- Target entity (e.g., condition/diagnosis)
  target_artifact_id VARCHAR(255) NOT NULL,
  target_artifact_type VARCHAR(50) NOT NULL,
  target_entity_text TEXT,

  -- Relationship metadata
  patient_id VARCHAR(255) NOT NULL,
  confidence_score FLOAT, -- 0.0-1.0, how confident we are in this relationship
  extraction_method VARCHAR(50), -- 'explicit_api', 'llm_inferred', 'temporal_correlation'

  -- Temporal information
  established_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP, -- NULL if still active

  -- Additional context
  clinical_notes TEXT, -- Any additional context about this relationship
  evidence_chunk_ids TEXT[], -- Array of chunk_ids that support this relationship

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient relationship traversal
CREATE INDEX IF NOT EXISTS idx_rel_source ON clinical_relationships(source_artifact_id, source_artifact_type);
CREATE INDEX IF NOT EXISTS idx_rel_target ON clinical_relationships(target_artifact_id, target_artifact_type);
CREATE INDEX IF NOT EXISTS idx_rel_patient ON clinical_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_rel_type ON clinical_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_rel_patient_type ON clinical_relationships(patient_id, relationship_type);

-- Composite index for bi-directional relationship queries
CREATE INDEX IF NOT EXISTS idx_rel_bidirectional ON clinical_relationships(source_artifact_id, target_artifact_id);

COMMENT ON TABLE clinical_relationships IS 'Stores explicit relationships between clinical entities for contextual reasoning';
COMMENT ON COLUMN clinical_relationships.relationship_type IS 'Type of relationship (medication_indication, procedure_diagnosis, etc.)';
COMMENT ON COLUMN clinical_relationships.confidence_score IS 'Confidence in relationship (0.0-1.0), higher for explicit API data';
COMMENT ON COLUMN clinical_relationships.extraction_method IS 'How relationship was discovered (explicit_api, llm_inferred, temporal_correlation)';
COMMENT ON COLUMN clinical_relationships.evidence_chunk_ids IS 'Chunk IDs that support this relationship for provenance';

-- ============================================================================
-- Enriched Artifacts Table
-- ============================================================================
-- Stores enriched versions of artifacts with extracted clinical context
-- ============================================================================

CREATE TABLE IF NOT EXISTS enriched_artifacts (
  -- Primary key (matches artifact_id from original data)
  artifact_id VARCHAR(255) PRIMARY KEY,

  -- Basic metadata
  patient_id VARCHAR(255) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  occurred_at TIMESTAMP NOT NULL,

  -- Original content
  original_text TEXT NOT NULL,

  -- Enriched content (what we'll actually index)
  enriched_text TEXT NOT NULL,
  -- Example: "Medication: Atorvastatin 40mg daily. Indication: Hyperlipidemia (ICD-10: E78.5).
  --           Prescribed for management of elevated cholesterol as part of cardiovascular risk reduction.
  --           Related to active diagnosis of Type 2 Diabetes Mellitus and Hypertension."

  -- Structured extractions
  extracted_entities JSONB, -- Medications, conditions, procedures as structured JSON
  clinical_context JSONB, -- Additional context (indication, rationale, goals, etc.)

  -- Relationship summary
  related_artifact_ids TEXT[], -- IDs of related artifacts
  relationship_summary TEXT, -- Human-readable summary of relationships

  -- Enrichment metadata
  enrichment_version VARCHAR(20), -- Track enrichment algorithm version
  enriched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enrichment_method VARCHAR(50), -- 'api_direct', 'llm_extraction', 'hybrid'

  -- Quality scores
  completeness_score FLOAT, -- 0.0-1.0, how complete the enrichment is
  context_depth_score FLOAT, -- 0.0-1.0, how much context was added

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enriched_patient ON enriched_artifacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_enriched_type ON enriched_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_enriched_occurred ON enriched_artifacts(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_enriched_patient_type ON enriched_artifacts(patient_id, artifact_type);

-- GIN index for JSONB columns (fast JSON queries)
CREATE INDEX IF NOT EXISTS idx_enriched_entities ON enriched_artifacts USING GIN (extracted_entities);
CREATE INDEX IF NOT EXISTS idx_enriched_context ON enriched_artifacts USING GIN (clinical_context);

-- Full-text search on enriched text
CREATE INDEX IF NOT EXISTS idx_enriched_text_search ON enriched_artifacts USING GIN (to_tsvector('english', enriched_text));

COMMENT ON TABLE enriched_artifacts IS 'Stores enriched versions of artifacts with clinical context and relationships';
COMMENT ON COLUMN enriched_artifacts.enriched_text IS 'Enhanced version with indication, context, relationships baked in';
COMMENT ON COLUMN enriched_artifacts.extracted_entities IS 'Structured extractions (medications, conditions, etc.) as JSON';
COMMENT ON COLUMN enriched_artifacts.clinical_context IS 'Additional context (indication, rationale, goals, etc.) as JSON';

-- ============================================================================
-- Clinical Entities Table
-- ============================================================================
-- Stores normalized clinical entities (medications, conditions, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_entities (
  -- Primary key
  entity_id VARCHAR(255) PRIMARY KEY,

  -- Entity type
  entity_type VARCHAR(50) NOT NULL,
  -- Values: 'medication', 'condition', 'procedure', 'lab_test', 'symptom', 'allergy'

  -- Entity text (as appears in source)
  original_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL, -- Standardized form

  -- Codes and identifiers
  code VARCHAR(50), -- ICD-10, RxNorm, SNOMED, etc.
  code_system VARCHAR(50), -- 'ICD10', 'RXNORM', 'SNOMED', etc.

  -- Patient context
  patient_id VARCHAR(255) NOT NULL,

  -- Source information
  source_artifact_ids TEXT[], -- All artifacts mentioning this entity
  source_chunk_ids TEXT[], -- All chunks mentioning this entity
  first_mentioned_at TIMESTAMP NOT NULL,
  last_mentioned_at TIMESTAMP NOT NULL,
  mention_count INTEGER DEFAULT 1,

  -- Clinical metadata (varies by entity type)
  metadata JSONB,
  -- For medications: {dosage, frequency, route, strength}
  -- For conditions: {severity, status, onset_date, clinical_status}
  -- For procedures: {type, anatomical_site, outcome}

  -- Status
  status VARCHAR(50), -- 'active', 'inactive', 'resolved', 'historical'

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entity_type ON clinical_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_patient ON clinical_entities(patient_id);
CREATE INDEX IF NOT EXISTS idx_entity_patient_type ON clinical_entities(patient_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_code ON clinical_entities(code);
CREATE INDEX IF NOT EXISTS idx_entity_normalized ON clinical_entities(normalized_text);
CREATE INDEX IF NOT EXISTS idx_entity_status ON clinical_entities(status);

-- GIN index for metadata JSON
CREATE INDEX IF NOT EXISTS idx_entity_metadata ON clinical_entities USING GIN (metadata);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_entity_text_search ON clinical_entities USING GIN (to_tsvector('english', normalized_text));

COMMENT ON TABLE clinical_entities IS 'Normalized clinical entities extracted from all patient artifacts';
COMMENT ON COLUMN clinical_entities.mention_count IS 'How many times this entity appears across all artifacts';

-- ============================================================================
-- Update Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist (for re-running migration)
DROP TRIGGER IF EXISTS update_clinical_relationships_updated_at ON clinical_relationships;
DROP TRIGGER IF EXISTS update_enriched_artifacts_updated_at ON enriched_artifacts;
DROP TRIGGER IF EXISTS update_clinical_entities_updated_at ON clinical_entities;

-- Create triggers
CREATE TRIGGER update_clinical_relationships_updated_at BEFORE UPDATE ON clinical_relationships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enriched_artifacts_updated_at BEFORE UPDATE ON enriched_artifacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_entities_updated_at BEFORE UPDATE ON clinical_entities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP TABLE IF EXISTS clinical_relationships CASCADE;
-- DROP TABLE IF EXISTS enriched_artifacts CASCADE;
-- DROP TABLE IF EXISTS clinical_entities CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- ============================================================================
