/**
 * Parsed Chunk Types
 *
 * Type definitions for chunks enriched with clinical entities.
 *
 * Requirements:
 * - Extend Chunk with entity information
 * - Support embedding ID for vector storage
 * - Ready for indexing pipeline
 *
 */

import { Chunk } from '../services/text-chunker.service';
import { ClinicalEntity } from './clinical-entity.types';

/**
 * Parsed Chunk Interface
 *
 * Chunk enriched with extracted clinical entities
 */
export interface ParsedChunk extends Chunk {
  entities: ClinicalEntity[]; // Extracted clinical entities
  embedding_id?: string; // Vector DB ID (set after embedding)
}

/**
 * Parser Result
 *
 * Result from parsing a batch of artifacts
 */
export interface ParserResult {
  chunks: ParsedChunk[];
  total_chunks: number;
  total_entities: number;
  artifacts_processed: number;
  processing_time_ms: number;
  errors: ParserError[];
}

/**
 * Parser Error
 *
 * Error information for failed artifact parsing
 */
export interface ParserError {
  artifact_id: string;
  error: string;
  message: string;
  timestamp: string;
}

/**
 * Parser Statistics
 *
 * Statistics about parsing operation
 */
export interface ParserStatistics {
  total_artifacts: number;
  successful: number;
  failed: number;
  total_chunks: number;
  total_entities: number;
  avg_chunks_per_artifact: number;
  avg_entities_per_chunk: number;
  entities_by_type: {
    medication: number;
    condition: number;
    symptom: number;
    procedure: number;
    dosage: number;
  };
}

/**
 * Chunk Filter
 *
 * Filter criteria for querying chunks
 */
export interface ChunkFilter {
  patient_id?: string; // Filter by patient
  artifact_id?: string; // Filter by artifact
  artifact_type?: 'care_plan' | 'medication' | 'note'; // Filter by type
  date_from?: string; // ISO 8601 date - chunks on or after this date
  date_to?: string; // ISO 8601 date - chunks on or before this date
  entity_type?: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage'; // Has entity of type
  entity_text?: string; // Has entity with text (case-insensitive)
  limit?: number; // Max results to return
  offset?: number; // Skip first N results
}

/**
 * Storage Statistics
 *
 * Statistics about chunk storage
 */
export interface StorageStatistics {
  total_chunks: number;
  total_patients: number;
  total_artifacts: number;
  chunks_by_type: {
    care_plan: number;
    medication: number;
    note: number;
  };
  oldest_chunk_date: string | null;
  newest_chunk_date: string | null;
  memory_usage_bytes?: number;
}

/**
 * Store Result
 *
 * Result from storing chunks
 */
export interface StoreResult {
  success: boolean;
  stored_count: number;
  skipped_count: number;
  errors: string[];
  processing_time_ms: number;
}
