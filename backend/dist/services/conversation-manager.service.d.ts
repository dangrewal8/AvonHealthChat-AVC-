/**
 * Conversation Manager Service
 *
 * Manage conversation context for follow-up queries.
 *
 * Features:
 * - Session management
 * - Follow-up query resolution
 * - Context window (last 5 turns)
 * - Session expiry (30 minutes)
 * - Entity and filter inheritance
 *
 */
/**
 * Query intent
 */
export type QueryIntent = 'RETRIEVE_MEDICATIONS' | 'RETRIEVE_DIAGNOSIS' | 'RETRIEVE_ALLERGIES' | 'RETRIEVE_PROCEDURES' | 'RETRIEVE_LAB_RESULTS' | 'RETRIEVE_VITALS' | 'RETRIEVE_IMMUNIZATIONS' | 'RETRIEVE_CARE_PLAN' | 'RETRIEVE_PROGRESS_NOTES' | 'RETRIEVE_GENERAL';
/**
 * Entity
 */
export interface Entity {
    text: string;
    type: string;
    confidence: number;
}
/**
 * Temporal filter
 */
export interface TemporalFilter {
    type: 'absolute' | 'relative';
    start?: string;
    end?: string;
    relative_period?: string;
}
/**
 * Structured query (simplified)
 */
export interface StructuredQuery {
    original_query: string;
    patient_id: string;
    intent: QueryIntent | null;
    entities: Entity[];
    temporal_filter: TemporalFilter | null;
    processed_at: string;
}
/**
 * UI Response (from orchestrator)
 */
export interface UIResponse {
    queryId: string;
    success: boolean;
    shortAnswer?: string;
    detailedSummary?: string;
    structuredExtractions?: any[];
    provenance?: any[];
    confidence?: {
        score: number;
        label: string;
        reason: string;
    };
    metadata?: {
        totalTimeMs: number;
        stages: Record<string, number>;
        partial?: boolean;
        error?: string;
    };
    error?: {
        code: string;
        message: string;
        userMessage: string;
        details?: any;
    };
}
/**
 * Conversation turn
 */
export interface ConversationTurn {
    query: string;
    structured_query: StructuredQuery;
    response: UIResponse;
    timestamp: string;
}
/**
 * Conversation context
 */
export interface ConversationContext {
    session_id: string;
    patient_id: string;
    turns: ConversationTurn[];
    last_entities: Entity[];
    last_temporal_filter: TemporalFilter | null;
    last_intent: QueryIntent | null;
    created_at: string;
    updated_at: string;
}
/**
 * Session
 */
export interface Session {
    session_id: string;
    patient_id: string;
    created_at: string;
    expires_at: string;
}
/**
 * Conversation Manager Class
 *
 * Manages conversation context for follow-up queries
 */
declare class ConversationManager {
    /**
     * Context window size (keep last 5 turns)
     */
    private readonly CONTEXT_WINDOW_SIZE;
    /**
     * Session expiry time (30 minutes in milliseconds)
     */
    private readonly SESSION_EXPIRY_MS;
    /**
     * Active sessions (in-memory store)
     * In production: use Redis or database
     */
    private sessions;
    /**
     * Create new conversation session
     *
     * @param patientId - Patient ID
     * @returns Session
     */
    createSession(patientId: string): Session;
    /**
     * Update conversation context
     *
     * @param sessionId - Session ID
     * @param query - User query
     * @param response - UI response from orchestrator
     */
    updateContext(sessionId: string, query: string, response: UIResponse): void;
    /**
     * Resolve follow-up query
     *
     * Detects follow-up queries and inherits context from previous turn
     *
     * @param query - User query
     * @param context - Conversation context
     * @returns Structured query with inherited context
     */
    resolveFollowUp(query: string, context: ConversationContext): StructuredQuery;
    /**
     * Get conversation context
     *
     * @param sessionId - Session ID
     * @returns Conversation context
     */
    getContext(sessionId: string): ConversationContext | null;
    /**
     * Delete session
     *
     * @param sessionId - Session ID
     */
    deleteSession(sessionId: string): void;
    /**
     * Clean up expired sessions
     *
     * Should be called periodically (e.g., every 5 minutes)
     */
    cleanupExpiredSessions(): void;
    /**
     * Get active session count
     *
     * @returns Number of active sessions
     */
    getActiveSessionCount(): number;
    /**
     * Detect follow-up query
     *
     * Checks for follow-up patterns like "what about...", "and...", "when did..."
     *
     * @param query - User query
     * @returns True if query is a follow-up
     */
    private detectFollowUp;
    /**
     * Detect query intent
     *
     * Simple keyword-based intent detection
     * In production: use ML model or NLU service
     *
     * @param query - User query
     * @returns Query intent
     */
    private detectIntent;
    /**
     * Extract entities from query
     *
     * Simple pattern matching for demo
     * In production: use NER model
     *
     * @param query - User query
     * @returns Entities
     */
    private extractEntities;
    /**
     * Extract temporal filter from query
     *
     * Simple pattern matching for demo
     * In production: use temporal expression parser
     *
     * @param query - User query
     * @returns Temporal filter
     */
    private extractTemporalFilter;
    /**
     * Explain conversation manager
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const conversationManager: ConversationManager;
export default conversationManager;
//# sourceMappingURL=conversation-manager.service.d.ts.map