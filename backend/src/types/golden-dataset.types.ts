/**
 * Golden Dataset Types
 *
 * Type definitions for golden dataset creation and validation.
 * Used for testing and evaluating RAG pipeline performance.
 *
 */

import { Entity, TemporalFilter, QueryIntent } from './query.types';

/**
 * Dataset category types
 */
export type DatasetCategory =
  | 'medication'
  | 'care_plan'
  | 'temporal'
  | 'entity'
  | 'negative'
  | 'ambiguous';

/**
 * Category distribution for dataset balance
 */
export const CATEGORY_DISTRIBUTION: Record<DatasetCategory, number> = {
  medication: 20, // "What medications did I prescribe?"
  care_plan: 15, // "Show me care plans from last month"
  temporal: 20, // "What changed in the last 3 months?"
  entity: 15, // "Find records mentioning ibuprofen"
  negative: 10, // Should find nothing
  ambiguous: 10, // Unclear queries
};

/**
 * Structured extraction from RAG pipeline
 */
export interface StructuredExtraction {
  type: string;
  [key: string]: any;
  provenance?: ProvenanceEntry[];
}

/**
 * Medication recommendation extraction
 */
export interface MedicationExtraction extends StructuredExtraction {
  type: 'medication_recommendation';
  medication: string;
  dose?: string;
  frequency?: string;
  intent: 'recommended' | 'prescribed' | 'discontinued';
  recommended_by?: string;
  recommendation_date?: string;
}

/**
 * Care plan extraction
 */
export interface CarePlanExtraction extends StructuredExtraction {
  type: 'care_plan';
  condition: string;
  goals?: string[];
  interventions?: string[];
  created_by?: string;
  created_date?: string;
}

/**
 * Provenance entry for extraction
 */
export interface ProvenanceEntry {
  artifact_id: string;
  char_offsets: [number, number];
  supporting_text: string;
  source: string;
  score: number;
}

/**
 * Ground truth for golden dataset entry
 */
export interface GroundTruth {
  /**
   * Artifact IDs that must be retrieved
   */
  relevant_artifact_ids: string[];

  /**
   * Expected structured extractions
   */
  expected_extractions: StructuredExtraction[];

  /**
   * Minimum acceptable confidence score
   */
  expected_confidence_min: number;

  /**
   * Minimum number of sources required
   */
  expected_sources_min: number;
}

/**
 * Acceptance criteria for evaluation
 */
export interface AcceptanceCriteria {
  /**
   * Minimum recall@5 (e.g., 0.9 means 90% of relevant docs in top 5)
   */
  recall_at_5_min: number;

  /**
   * Minimum precision@5 (e.g., 0.8 means 80% of top 5 are relevant)
   */
  precision_at_5_min: number;

  /**
   * Minimum extraction F1 score
   */
  extraction_f1_min: number;

  /**
   * Minimum citation accuracy
   */
  citation_accuracy_min: number;
}

/**
 * Golden dataset entry with ground truth
 */
export interface GoldenDatasetEntry {
  /**
   * Unique identifier for this entry
   */
  id: string;

  /**
   * Category of this query
   */
  category: DatasetCategory;

  /**
   * Natural language query
   */
  query: string;

  /**
   * Patient ID for this query
   */
  patient_id: string;

  /**
   * Expected query understanding
   */
  expected_intent: QueryIntent;

  /**
   * Expected entities to be extracted
   */
  expected_entities: Entity[];

  /**
   * Expected temporal filter
   */
  expected_temporal: TemporalFilter | null;

  /**
   * Ground truth results
   */
  ground_truth: GroundTruth;

  /**
   * Evaluation acceptance criteria
   */
  acceptance_criteria: AcceptanceCriteria;

  /**
   * When this entry was created
   */
  created_at: string;

  /**
   * Who verified this entry (optional)
   */
  verified_by?: string;

  /**
   * Additional metadata
   */
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    notes?: string;
    tags?: string[];
  };
}

/**
 * Complete golden dataset
 */
export interface GoldenDataset {
  /**
   * Dataset version
   */
  version: string;

  /**
   * When this dataset was created
   */
  created_at: string;

  /**
   * Total number of entries
   */
  total_entries: number;

  /**
   * All dataset entries
   */
  entries: GoldenDatasetEntry[];

  /**
   * Count per category
   */
  categories: Record<DatasetCategory, number>;

  /**
   * Dataset metadata
   */
  metadata?: {
    description?: string;
    author?: string;
    purpose?: string;
  };
}

/**
 * Validation result for dataset entry
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Evaluation result for a single query
 */
export interface EvaluationResult {
  entry_id: string;
  query: string;

  /**
   * Retrieval metrics
   */
  retrieval: {
    recall_at_5: number;
    precision_at_5: number;
    retrieved_relevant: string[];
    missed_relevant: string[];
    false_positives: string[];
  };

  /**
   * Extraction metrics
   */
  extraction: {
    f1_score: number;
    precision: number;
    recall: number;
    matched_extractions: number;
    expected_extractions: number;
    actual_extractions: number;
  };

  /**
   * Citation metrics
   */
  citation: {
    accuracy: number;
    correct_citations: number;
    incorrect_citations: number;
    missing_citations: number;
  };

  /**
   * Overall confidence
   */
  confidence: number;

  /**
   * Whether this entry passes acceptance criteria
   */
  passes: boolean;

  /**
   * Failed criteria
   */
  failed_criteria: string[];

  /**
   * Execution time in milliseconds
   */
  execution_time_ms: number;
}

/**
 * Dataset evaluation report
 */
export interface DatasetEvaluationReport {
  dataset_version: string;
  evaluated_at: string;
  total_entries: number;
  passed_entries: number;
  failed_entries: number;

  /**
   * Aggregate metrics
   */
  aggregate_metrics: {
    mean_recall_at_5: number;
    mean_precision_at_5: number;
    mean_extraction_f1: number;
    mean_citation_accuracy: number;
    mean_confidence: number;
    mean_execution_time_ms: number;
  };

  /**
   * Per-category breakdown
   */
  category_breakdown: Record<
    DatasetCategory,
    {
      total: number;
      passed: number;
      failed: number;
      mean_recall: number;
      mean_precision: number;
    }
  >;

  /**
   * Individual results
   */
  results: EvaluationResult[];

  /**
   * Failed entries for investigation
   */
  failed_entries_detail: Array<{
    entry_id: string;
    query: string;
    category: DatasetCategory;
    failed_criteria: string[];
  }>;
}

/**
 * Default acceptance criteria
 */
export const DEFAULT_ACCEPTANCE_CRITERIA: AcceptanceCriteria = {
  recall_at_5_min: 0.9,
  precision_at_5_min: 0.8,
  extraction_f1_min: 0.85,
  citation_accuracy_min: 0.95,
};

/**
 * Category-specific acceptance criteria
 */
export const CATEGORY_ACCEPTANCE_CRITERIA: Record<
  DatasetCategory,
  AcceptanceCriteria
> = {
  medication: {
    recall_at_5_min: 0.95,
    precision_at_5_min: 0.9,
    extraction_f1_min: 0.9,
    citation_accuracy_min: 0.98,
  },
  care_plan: {
    recall_at_5_min: 0.9,
    precision_at_5_min: 0.85,
    extraction_f1_min: 0.85,
    citation_accuracy_min: 0.95,
  },
  temporal: {
    recall_at_5_min: 0.85,
    precision_at_5_min: 0.8,
    extraction_f1_min: 0.8,
    citation_accuracy_min: 0.9,
  },
  entity: {
    recall_at_5_min: 0.9,
    precision_at_5_min: 0.85,
    extraction_f1_min: 0.85,
    citation_accuracy_min: 0.95,
  },
  negative: {
    recall_at_5_min: 1.0, // Should return nothing
    precision_at_5_min: 1.0, // Should not return false positives
    extraction_f1_min: 1.0,
    citation_accuracy_min: 1.0,
  },
  ambiguous: {
    recall_at_5_min: 0.7,
    precision_at_5_min: 0.7,
    extraction_f1_min: 0.7,
    citation_accuracy_min: 0.8,
  },
};
