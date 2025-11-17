/**
 * Query Understanding Agent (QUA) Service
 *
 * Orchestrates query parsing components to generate structured query representation
 *
 * Features:
 * - Temporal information parsing
 * - Intent classification
 * - Entity extraction
 * - Filter construction
 * - Query validation
 *
 */
import { TemporalFilter } from './temporal-parser.service';
import { QueryIntent } from './intent-classifier.service';
import { Entity } from './entity-extractor.service';
import { DetailLevel } from './detail-level-analyzer.service';
/**
 * Structured query representation
 */
export interface StructuredQuery {
    original_query: string;
    patient_id: string;
    intent: QueryIntent;
    entities: Entity[];
    temporal_filter: TemporalFilter | null;
    filters: {
        artifact_types?: string[];
        date_range?: {
            from: string;
            to: string;
        };
    };
    detail_level: DetailLevel;
    query_id: string;
}
/**
 * Query parsing result with metadata
 */
export interface QueryParsingResult extends StructuredQuery {
    intent_confidence: number;
    ambiguous_intents?: Array<{
        intent: QueryIntent;
        confidence: number;
    }>;
    entity_count: {
        medications: number;
        conditions: number;
        symptoms: number;
        dates: number;
        persons: number;
    };
    has_temporal: boolean;
}
/**
 * Query Understanding Agent Class
 *
 * Orchestrates all query parsing components to generate structured query representation
 */
declare class QueryUnderstandingAgent {
    /**
     * Intent to artifact type mapping
     * Maps query intents to relevant medical record artifact types
     */
    private readonly intentToArtifactTypes;
    /**
     * Parse query and generate structured representation
     *
     * @param query - Natural language query
     * @param patientId - Patient identifier
     * @returns Structured query with filters and metadata
     *
     * @example
     * parse("What medications for diabetes in the last 3 months?", "patient_123")
     * // Returns: {
     * //   original_query: "What medications for diabetes in the last 3 months?",
     * //   patient_id: "patient_123",
     * //   intent: "retrieve_medications",
     * //   entities: [...],
     * //   temporal_filter: {...},
     * //   filters: {
     * //     artifact_types: ["medication_order", "prescription"],
     * //     date_range: { from: "2024-07-15T00:00:00.000Z", to: "2024-10-15T23:59:59.999Z" }
     * //   },
     * //   detail_level: 3,
     * //   query_id: "550e8400-e29b-41d4-a716-446655440000"
     * // }
     */
    parse(query: string, patientId: string): StructuredQuery;
    /**
     * Parse query with extended metadata
     *
     * @param query - Natural language query
     * @param patientId - Patient identifier
     * @returns Query parsing result with additional metadata
     */
    parseWithMetadata(query: string, patientId: string): QueryParsingResult;
    /**
     * Build filters based on intent and temporal info
     *
     * @param intent - Classified query intent
     * @param temporalFilter - Temporal filter (if any)
     * @returns Filter object
     */
    private buildFilters;
    /**
     * Count entities by type
     *
     * @param entities - List of entities
     * @returns Count by entity type
     */
    private countEntitiesByType;
    /**
     * Validate input parameters
     *
     * @param query - Query to validate
     * @param patientId - Patient ID to validate
     * @throws Error if validation fails
     */
    private validateInput;
    /**
     * Get artifact types for a specific intent
     *
     * @param intent - Query intent
     * @returns Artifact types or undefined
     */
    getArtifactTypesForIntent(intent: QueryIntent): string[] | undefined;
    /**
     * Check if query has sufficient context for retrieval
     *
     * @param structuredQuery - Structured query to check
     * @returns True if query has sufficient context
     */
    hasSufficientContext(structuredQuery: StructuredQuery): boolean;
    /**
     * Extract medication entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Medication entities
     */
    getMedications(structuredQuery: StructuredQuery): Entity[];
    /**
     * Extract condition entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Condition entities
     */
    getConditions(structuredQuery: StructuredQuery): Entity[];
    /**
     * Extract symptom entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Symptom entities
     */
    getSymptoms(structuredQuery: StructuredQuery): Entity[];
    /**
     * Get query summary for logging
     *
     * @param structuredQuery - Structured query
     * @returns Human-readable summary
     */
    getSummary(structuredQuery: StructuredQuery): string;
    /**
     * Batch parse multiple queries
     *
     * @param queries - Array of queries with patient IDs
     * @returns Array of structured queries
     */
    parseBatch(queries: Array<{
        query: string;
        patientId: string;
    }>): StructuredQuery[];
    /**
     * Validate and sanitize query
     *
     * @param query - Query to sanitize
     * @returns Sanitized query
     */
    sanitizeQuery(query: string): string;
}
declare const queryUnderstandingAgent: QueryUnderstandingAgent;
export default queryUnderstandingAgent;
//# sourceMappingURL=query-understanding-agent.service.d.ts.map