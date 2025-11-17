/**
 * Clinical Entity Types
 *
 * Type definitions for clinical entity recognition.
 *
 * Requirements:
 * - Define entity types for medical terms
 * - Track char offsets for provenance
 * - Support entity normalization
 *
 * NO external NLP libraries
 */
/**
 * Clinical Entity Interface
 *
 * Represents a recognized medical entity within text
 */
export interface ClinicalEntity {
    text: string;
    type: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage';
    char_offsets: [number, number];
    normalized: string;
}
/**
 * Entity Type
 *
 * Types of clinical entities we recognize
 */
export type EntityType = 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage';
/**
 * Pattern Match Result
 *
 * Internal type for pattern matching results
 */
export interface PatternMatch {
    text: string;
    type: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage';
    start: number;
    end: number;
}
/**
 * Medical Abbreviation Mapping
 *
 * Maps abbreviations to full medical terms
 */
export interface AbbreviationMapping {
    [abbreviation: string]: {
        expanded: string;
        type: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage';
    };
}
/**
 * Chunk with Entities
 *
 * Extended chunk interface with extracted entities
 */
export interface ChunkWithEntities {
    chunk_id: string;
    artifact_id: string;
    patient_id: string;
    artifact_type: string;
    chunk_text: string;
    char_offsets: [number, number];
    occurred_at: string;
    author?: string;
    source: string;
    created_at: string;
    entities: ClinicalEntity[];
}
/**
 * Entity Extraction Result
 *
 * Result from entity extraction process
 */
export interface EntityExtractionResult {
    chunk_id: string;
    entities: ClinicalEntity[];
    entity_count: number;
    by_type: {
        medication: number;
        condition: number;
        symptom: number;
        procedure: number;
        dosage: number;
    };
}
//# sourceMappingURL=clinical-entity.types.d.ts.map