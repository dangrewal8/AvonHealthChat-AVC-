/**
 * Clinical NER Service
 *
 * Clinical entity recognition for medical terms in chunks.
 *
 * Requirements:
 * - Pattern-based extraction (medications, dosages, conditions, symptoms, procedures)
 * - Medical abbreviations handling
 * - Entity normalization
 * - Char offset tracking
 *
 * NO spaCy, NLTK, or Python NLP libraries
 */
import { ClinicalEntity, EntityExtractionResult } from '../types/clinical-entity.types';
/**
 * Clinical NER Class
 *
 * Extract and normalize clinical entities from medical text
 */
declare class ClinicalNER {
    /**
     * Medical abbreviations mapping
     *
     * Common medical abbreviations and their expansions
     */
    private readonly abbreviations;
    /**
     * Medication name patterns
     *
     * Common suffixes and patterns for drug names
     */
    private readonly medicationSuffixes;
    /**
     * Common medication names
     */
    private readonly commonMedications;
    /**
     * Dosage patterns
     *
     * Regex patterns for dosage recognition
     */
    private readonly dosagePatterns;
    /**
     * Condition patterns
     *
     * Common medical conditions
     */
    private readonly conditions;
    /**
     * Symptom patterns
     *
     * Common patient symptoms
     */
    private readonly symptoms;
    /**
     * Procedure patterns
     *
     * Common medical procedures
     */
    private readonly procedures;
    /**
     * Extract entities from chunk text
     *
     * Main entry point for entity extraction
     *
     * @param chunkText - Text to extract entities from
     * @returns Array of clinical entities
     */
    extractEntities(chunkText: string): ClinicalEntity[];
    /**
     * Normalize entity
     *
     * Convert entity to standardized form
     *
     * @param entity - Entity to normalize
     * @returns Normalized string
     */
    normalizeEntity(entity: ClinicalEntity): string;
    /**
     * Extract medications
     *
     * Find medication names using suffix patterns and common names
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractMedications;
    /**
     * Extract dosages
     *
     * Find dosage information using patterns
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractDosages;
    /**
     * Extract conditions
     *
     * Find medical conditions
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractConditions;
    /**
     * Extract symptoms
     *
     * Find patient symptoms
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractSymptoms;
    /**
     * Extract procedures
     *
     * Find medical procedures
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractProcedures;
    /**
     * Extract abbreviations
     *
     * Find known medical abbreviations
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    private extractAbbreviations;
    /**
     * Deduplicate matches
     *
     * Remove duplicate and overlapping matches
     *
     * @param matches - Array of pattern matches
     * @returns Deduplicated array
     */
    private deduplicateMatches;
    /**
     * Normalize dosage
     *
     * Standardize dosage format
     *
     * @param dosage - Dosage string
     * @returns Normalized dosage
     */
    private normalizeDosage;
    /**
     * Convert to title case
     *
     * @param text - Text to convert
     * @returns Title cased text
     */
    private toTitleCase;
    /**
     * Escape regex special characters
     *
     * @param text - Text to escape
     * @returns Escaped text
     */
    private escapeRegex;
    /**
     * Get extraction statistics
     *
     * Analyze extracted entities
     *
     * @param entities - Extracted entities
     * @param chunkId - Chunk ID
     * @returns Extraction result with statistics
     */
    getExtractionStats(entities: ClinicalEntity[], chunkId: string): EntityExtractionResult;
    /**
     * Explain Clinical NER
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const clinicalNER: ClinicalNER;
export default clinicalNER;
//# sourceMappingURL=clinical-ner.service.d.ts.map