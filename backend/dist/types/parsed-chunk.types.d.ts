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
    entities: ClinicalEntity[];
    embedding_id?: string;
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
    patient_id?: string;
    artifact_id?: string;
    artifact_type?: 'care_plan' | 'medication' | 'note';
    date_from?: string;
    date_to?: string;
    entity_type?: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage';
    entity_text?: string;
    limit?: number;
    offset?: number;
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
//# sourceMappingURL=parsed-chunk.types.d.ts.map