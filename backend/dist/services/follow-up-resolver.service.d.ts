/**
 * Follow-Up Resolver Service
 *
 * Handle follow-up queries by using conversation context.
 *
 * Features:
 * - Follow-up detection using pattern matching
 * - Context merging (entities, temporal filters, intent)
 * - Entity inheritance from previous queries
 * - Temporal filter inheritance
 * - Intent preservation
 *
 * NO external NLP libraries
 */
/**
 * Query intent
 */
export declare enum QueryIntent {
    RETRIEVE_MEDICATIONS = "retrieve_medications",
    RETRIEVE_DIAGNOSES = "retrieve_diagnoses",
    RETRIEVE_LAB_RESULTS = "retrieve_lab_results",
    RETRIEVE_VITALS = "retrieve_vitals",
    RETRIEVE_PROCEDURES = "retrieve_procedures",
    RETRIEVE_ALLERGIES = "retrieve_allergies",
    RETRIEVE_IMMUNIZATIONS = "retrieve_immunizations",
    RETRIEVE_ENCOUNTERS = "retrieve_encounters",
    GENERAL_QUERY = "general_query",
    UNKNOWN = "unknown"
}
/**
 * Entity extracted from query
 */
export interface Entity {
    type: 'medication' | 'diagnosis' | 'lab_test' | 'vital' | 'procedure' | 'allergy' | 'immunization' | 'encounter' | 'symptom' | 'body_part';
    value: string;
    normalized?: string;
}
/**
 * Temporal filter
 */
export interface TemporalFilter {
    type: 'absolute' | 'relative';
    start?: string;
    end?: string;
    relative?: 'today' | 'this_week' | 'this_month' | 'last_week' | 'last_month' | 'last_year';
}
/**
 * Structured query
 */
export interface StructuredQuery {
    original_query: string;
    patient_id: string;
    intent: QueryIntent;
    entities: Entity[];
    temporal_filter: TemporalFilter | null;
    processed_at: string;
}
/**
 * Conversation context (simplified)
 */
export interface ConversationContext {
    session_id: string;
    patient_id: string;
    last_query?: StructuredQuery;
    last_entities: Entity[];
    last_temporal_filter: TemporalFilter | null;
    last_intent: QueryIntent | null;
}
/**
 * Follow-Up Resolver Class
 *
 * Detect and resolve follow-up queries using conversation context
 */
declare class FollowUpResolver {
    /**
     * Follow-up detection patterns
     */
    private readonly FOLLOW_UP_PATTERNS;
    /**
     * Check if query is a follow-up
     *
     * Uses pattern matching to detect follow-up indicators
     *
     * @param query - User query
     * @returns True if query is likely a follow-up
     */
    isFollowUp(query: string): boolean;
    /**
     * Resolve follow-up query using conversation context
     *
     * Takes a follow-up query and enriches it with context from previous query
     *
     * @param query - Current query
     * @param context - Conversation context
     * @returns Resolved structured query with inherited context
     */
    resolveFollowUp(query: string, context: ConversationContext): StructuredQuery;
    /**
     * Merge context from previous query
     *
     * Intelligently combines new query with previous query context
     *
     * @param newQuery - Current structured query
     * @param previousQuery - Previous structured query
     * @returns Merged structured query
     */
    mergeContext(newQuery: StructuredQuery, previousQuery: StructuredQuery): StructuredQuery;
    /**
     * Parse query into structured query (basic parsing)
     *
     * @param query - User query
     * @param patientId - Patient ID
     * @returns Structured query
     */
    private parseQuery;
    /**
     * Create new query (no context)
     *
     * @param query - User query
     * @param patientId - Patient ID
     * @returns Structured query
     */
    private createNewQuery;
    /**
     * Extract entities from query (basic extraction)
     *
     * @param query - User query
     * @returns Array of entities
     */
    private extractEntities;
    /**
     * Extract temporal filter from query
     *
     * @param query - User query
     * @returns Temporal filter or null
     */
    private extractTemporalFilter;
    /**
     * Detect intent from query
     *
     * @param query - User query
     * @param entities - Extracted entities
     * @returns Query intent
     */
    private detectIntent;
    /**
     * Get follow-up patterns
     *
     * @returns Array of follow-up pattern descriptions
     */
    getFollowUpPatterns(): string[];
    /**
     * Explain follow-up resolver
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const followUpResolver: FollowUpResolver;
export default followUpResolver;
//# sourceMappingURL=follow-up-resolver.service.d.ts.map