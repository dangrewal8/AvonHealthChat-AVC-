/**
 * Named Entity Extraction Service
 *
 * Rule-based entity extraction for medical queries using pattern matching
 *
 * Features:
 * - Extract medications, conditions, symptoms, dates, persons
 * - Entity normalization (lowercase, stemming, abbreviations)
 * - Confidence scoring
 * - Integration with TemporalParser for date extraction
 *
 */
/**
 * Entity type
 */
export type EntityType = 'medication' | 'condition' | 'date' | 'person' | 'symptom';
/**
 * Entity interface
 */
export interface Entity {
    text: string;
    type: EntityType;
    normalized: string;
    confidence: number;
    position?: {
        start: number;
        end: number;
    };
}
/**
 * Entity Extractor Class
 *
 * Rule-based extraction using keyword and pattern matching
 */
declare class EntityExtractor {
    /**
     * Medication patterns
     * Common medications, drug classes, and brand names
     */
    private readonly medicationPatterns;
    /**
     * Condition patterns
     * Common medical conditions and diagnoses
     */
    private readonly conditionPatterns;
    /**
     * Symptom patterns
     * Common symptoms and complaints
     */
    private readonly symptomPatterns;
    /**
     * Person indicators (titles, roles)
     */
    private readonly personPatterns;
    /**
     * Medical abbreviations and their expanded forms
     */
    private readonly abbreviations;
    /**
     * Regex patterns for special entity types
     */
    private readonly specialPatterns;
    /**
     * Extract entities from query
     *
     * @param query - Natural language query
     * @returns List of extracted entities
     *
     * @example
     * extractEntities("Patient with diabetes on metformin 500mg twice daily")
     * // Returns: [
     * //   { text: "diabetes", type: "condition", normalized: "diabetes", confidence: 1.0 },
     * //   { text: "metformin", type: "medication", normalized: "metformin", confidence: 1.0 },
     * //   { text: "500mg", type: "medication", normalized: "500 milligram", confidence: 0.7 }
     * // ]
     */
    extractEntities(query: string): Entity[];
    /**
     * Extract medication entities
     *
     * @param query - Original query
     * @returns Medication entities
     */
    private extractMedications;
    /**
     * Extract condition entities
     *
     * @param query - Original query
     * @returns Condition entities
     */
    private extractConditions;
    /**
     * Extract symptom entities
     *
     * @param query - Original query
     * @returns Symptom entities
     */
    private extractSymptoms;
    /**
     * Extract person entities
     *
     * @param query - Original query
     * @returns Person entities
     */
    private extractPersons;
    /**
     * Extract date entities using TemporalParser
     *
     * @param query - Original query
     * @returns Date entities
     */
    private extractDates;
    /**
     * Extract special patterns (dosages, frequencies, etc.)
     *
     * @param query - Original query
     * @returns Special pattern entities
     */
    private extractSpecialPatterns;
    /**
     * Normalize entity
     *
     * @param entity - Entity to normalize
     * @returns Normalized entity
     *
     * @example
     * normalizeEntity({ text: "Ibuprofen", type: "medication", normalized: "", confidence: 1.0 })
     * // Returns: { text: "Ibuprofen", type: "medication", normalized: "ibuprofen", confidence: 1.0 }
     */
    normalizeEntity(entity: Entity): Entity;
    /**
     * Normalize a term
     *
     * @param term - Term to normalize
     * @returns Normalized term
     */
    private normalizeTerm;
    /**
     * Expand medical abbreviations
     *
     * @param term - Term to expand
     * @returns Expanded term
     */
    private expandAbbreviation;
    /**
     * Apply simple stemming
     *
     * @param term - Term to stem
     * @returns Stemmed term
     */
    private applyStemming;
    /**
     * Deduplicate entities (remove duplicates and overlapping entities)
     *
     * @param entities - List of entities
     * @returns Deduplicated entities
     */
    private deduplicateEntities;
    /**
     * Escape special regex characters
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    private escapeRegex;
    /**
     * Get entity patterns for a specific type
     *
     * @param type - Entity type
     * @returns List of patterns for that type
     */
    getEntityPatterns(type: EntityType): string[];
    /**
     * Get all abbreviations
     *
     * @returns Abbreviation mappings
     */
    getAbbreviations(): Record<string, string>;
    /**
     * Extract entities by type
     *
     * @param query - Natural language query
     * @param type - Entity type to extract
     * @returns Entities of specified type
     */
    extractByType(query: string, type: EntityType): Entity[];
    /**
     * Check if query contains entity of specific type
     *
     * @param query - Natural language query
     * @param type - Entity type to check
     * @returns True if entity type is found
     */
    hasEntityType(query: string, type: EntityType): boolean;
}
declare const entityExtractor: EntityExtractor;
export default entityExtractor;
//# sourceMappingURL=entity-extractor.service.d.ts.map