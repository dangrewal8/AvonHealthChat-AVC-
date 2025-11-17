/**
 * Enrichment Types
 *
 * Types for enriched artifact data and clinical relationships
 */

export type RelationshipType =
  | 'medication_indication'    // Medication → Condition
  | 'procedure_diagnosis'      // Procedure → Diagnosis
  | 'care_plan_condition'      // Care Plan → Condition
  | 'lab_condition'            // Lab Result → Condition
  | 'symptom_diagnosis'        // Symptom → Diagnosis
  | 'medication_interaction';  // Medication → Medication

export type ExtractionMethod =
  | 'explicit_api'         // Directly from API response fields
  | 'llm_inferred'         // Inferred by LLM from text
  | 'temporal_correlation' // Inferred from temporal proximity
  | 'hybrid';              // Combination of methods

export type EntityType =
  | 'medication'
  | 'condition'
  | 'procedure'
  | 'lab_test'
  | 'symptom'
  | 'allergy';

export type EntityStatus =
  | 'active'
  | 'inactive'
  | 'resolved'
  | 'historical';

/**
 * Clinical Relationship
 */
export interface ClinicalRelationship {
  relationship_id: string;
  relationship_type: RelationshipType;

  // Source entity
  source_artifact_id: string;
  source_artifact_type: string;
  source_entity_text: string;

  // Target entity
  target_artifact_id: string;
  target_artifact_type: string;
  target_entity_text: string;

  // Metadata
  patient_id: string;
  confidence_score: number; // 0.0-1.0
  extraction_method: ExtractionMethod;

  // Temporal
  established_at: string; // ISO 8601
  ended_at?: string; // ISO 8601 or null

  // Context
  clinical_notes?: string;
  evidence_chunk_ids?: string[];

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Clinical Entity
 */
export interface ClinicalEntity {
  entity_id: string;
  entity_type: EntityType;

  // Text representations
  original_text: string;
  normalized_text: string;

  // Codes
  code?: string;
  code_system?: string; // ICD10, RXNORM, SNOMED, etc.

  // Patient context
  patient_id: string;

  // Source tracking
  source_artifact_ids: string[];
  source_chunk_ids: string[];
  first_mentioned_at: string; // ISO 8601
  last_mentioned_at: string; // ISO 8601
  mention_count: number;

  // Clinical metadata (varies by type)
  metadata: Record<string, any>;

  // Status
  status: EntityStatus;

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Enriched Artifact
 */
export interface EnrichedArtifact {
  artifact_id: string;
  patient_id: string;
  artifact_type: string;
  occurred_at: string;

  // Content
  original_text: string;
  enriched_text: string; // Enhanced with context

  // Structured data
  extracted_entities: Record<string, any>;
  clinical_context: Record<string, any>;

  // Relationships
  related_artifact_ids: string[];
  relationship_summary: string;

  // Enrichment metadata
  enrichment_version: string;
  enriched_at: string;
  enrichment_method: string;

  // Quality scores
  completeness_score: number; // 0.0-1.0
  context_depth_score: number; // 0.0-1.0

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Medication with Indication (from API)
 */
export interface MedicationWithIndication {
  id: string;
  patient_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  prescribed_at: string;
  prescriber?: string;

  // NEW: Indication fields (may come from API)
  indication?: string; // e.g., "Hyperlipidemia"
  indication_code?: string; // e.g., "E78.5"
  indication_code_system?: string; // e.g., "ICD10"
  reason?: string; // Clinical rationale

  // Related condition IDs (if available from API)
  related_condition_ids?: string[];

  [key: string]: any;
}

/**
 * Condition with Details (from API)
 */
export interface ConditionWithDetails {
  id: string;
  patient_id: string;
  name: string;
  code?: string; // ICD-10
  code_system?: string;
  status?: string; // active, resolved, etc.
  severity?: string;
  onset_date?: string;
  diagnosis_date?: string;
  clinical_notes?: string;

  // Related medication IDs (if available from API)
  related_medication_ids?: string[];

  [key: string]: any;
}

/**
 * Care Plan with Goals (from API)
 */
export interface CarePlanWithGoals {
  id: string;
  patient_id: string;
  title?: string;
  description?: string;
  created_at: string;

  // NEW: Care plan details
  goals?: Array<{
    description: string;
    target_date?: string;
    achievement_status?: string;
  }>;
  interventions?: Array<{
    description: string;
    type?: string;
  }>;
  rationale?: string;

  // Related condition IDs
  related_condition_ids?: string[];

  [key: string]: any;
}

/**
 * Enrichment Result
 */
export interface EnrichmentResult {
  success: boolean;
  artifacts_enriched: number;
  relationships_created: number;
  entities_extracted: number;
  errors: Array<{
    artifact_id: string;
    error: string;
  }>;
  duration_ms: number;
}
