/**
 * Session Manager Service
 *
 * Maintain session timeout (30 minutes) per ChatGPT specification.
 *
 * Features:
 * - Session creation with unique IDs
 * - 30-minute timeout
 * - Automatic session renewal on access
 * - Automatic cleanup of expired sessions
 * - Max session limit (100 sessions)
 * - LRU eviction when limit reached
 * - Integration with conversation context
 *
 * NO external session libraries
 */
/**
 * Conversation turn
 */
export interface ConversationTurn {
    query: string;
    response: any;
    timestamp: string;
}
/**
 * Conversation context
 */
export interface ConversationContext {
    session_id: string;
    patient_id: string;
    turns: ConversationTurn[];
    last_entities: any[];
    last_temporal_filter: any | null;
    last_intent: string | null;
    created_at: string;
    updated_at: string;
}
/**
 * Session
 */
export interface Session {
    session_id: string;
    patient_id: string;
    conversation_context: ConversationContext;
    created_at: number;
    last_accessed: number;
    expires_at: number;
}
/**
 * Session statistics
 */
export interface SessionStats {
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
    oldest_session_age_ms: number;
    newest_session_age_ms: number;
}
/**
 * Session Manager Class
 *
 * Manage user sessions with automatic timeout and cleanup
 */
declare class SessionManager {
    /**
     * Active sessions
     */
    private sessions;
    /**
     * Session timeout (30 minutes)
     */
    private readonly TIMEOUT_MS;
    /**
     * Maximum sessions
     */
    private readonly MAX_SESSIONS;
    /**
     * Cleanup interval (5 minutes)
     */
    private readonly CLEANUP_INTERVAL_MS;
    /**
     * Cleanup interval handle
     */
    private cleanupInterval;
    /**
     * Constructor
     *
     * Starts automatic cleanup interval
     */
    constructor();
    /**
     * Create session
     *
     * Creates new session with conversation context
     *
     * @param patientId - Patient ID
     * @returns Created session
     */
    createSession(patientId: string): Session;
    /**
     * Get session
     *
     * Retrieves session and extends expiration if valid
     *
     * @param sessionId - Session ID
     * @returns Session or null if not found/expired
     */
    getSession(sessionId: string): Session | null;
    /**
     * Update session
     *
     * Updates conversation context and extends expiration
     *
     * @param sessionId - Session ID
     * @param context - Updated conversation context
     */
    updateSession(sessionId: string, context: ConversationContext): void;
    /**
     * Delete session
     *
     * Removes session from storage
     *
     * @param sessionId - Session ID
     */
    deleteSession(sessionId: string): void;
    /**
     * Cleanup expired sessions
     *
     * Removes all sessions past expiration time
     */
    cleanup(): void;
    /**
     * Evict oldest session
     *
     * Removes least recently accessed session
     */
    private evictOldestSession;
    /**
     * Get session count
     *
     * @returns Number of active sessions
     */
    getSessionCount(): number;
    /**
     * Get statistics
     *
     * @returns Session statistics
     */
    getStats(): SessionStats;
    /**
     * Get all sessions for patient
     *
     * @param patientId - Patient ID
     * @returns Array of sessions for patient
     */
    getSessionsByPatient(patientId: string): Session[];
    /**
     * Check if session is expired
     *
     * @param sessionId - Session ID
     * @returns True if session is expired or not found
     */
    isExpired(sessionId: string): boolean;
    /**
     * Get time until expiration
     *
     * @param sessionId - Session ID
     * @returns Milliseconds until expiration, or 0 if expired/not found
     */
    getTimeUntilExpiration(sessionId: string): number;
    /**
     * Extend session expiration
     *
     * Extends expiration by another 30 minutes
     *
     * @param sessionId - Session ID
     * @returns True if extended, false if session not found
     */
    extendSession(sessionId: string): boolean;
    /**
     * Clear all sessions
     *
     * Removes all sessions (for testing)
     */
    clearAll(): void;
    /**
     * Stop cleanup interval
     *
     * Call when shutting down service
     */
    stopCleanup(): void;
    /**
     * Explain session manager
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const sessionManager: SessionManager;
export default sessionManager;
//# sourceMappingURL=session-manager.service.d.ts.map