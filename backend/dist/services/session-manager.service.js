"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/**
 * Session Manager Class
 *
 * Manage user sessions with automatic timeout and cleanup
 */
class SessionManager {
    /**
     * Active sessions
     */
    sessions = new Map();
    /**
     * Session timeout (30 minutes)
     */
    TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    /**
     * Maximum sessions
     */
    MAX_SESSIONS = 100;
    /**
     * Cleanup interval (5 minutes)
     */
    CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    /**
     * Cleanup interval handle
     */
    cleanupInterval;
    /**
     * Constructor
     *
     * Starts automatic cleanup interval
     */
    constructor() {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
        // Prevent cleanup interval from keeping process alive
        this.cleanupInterval.unref();
    }
    /**
     * Create session
     *
     * Creates new session with conversation context
     *
     * @param patientId - Patient ID
     * @returns Created session
     */
    createSession(patientId) {
        const now = Date.now();
        const session = {
            session_id: (0, uuid_1.v4)(),
            patient_id: patientId,
            conversation_context: {
                session_id: '',
                patient_id: patientId,
                turns: [],
                last_entities: [],
                last_temporal_filter: null,
                last_intent: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            created_at: now,
            last_accessed: now,
            expires_at: now + this.TIMEOUT_MS,
        };
        session.conversation_context.session_id = session.session_id;
        // Enforce max sessions
        if (this.sessions.size >= this.MAX_SESSIONS) {
            this.evictOldestSession();
        }
        this.sessions.set(session.session_id, session);
        return session;
    }
    /**
     * Get session
     *
     * Retrieves session and extends expiration if valid
     *
     * @param sessionId - Session ID
     * @returns Session or null if not found/expired
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Check if expired
        if (Date.now() > session.expires_at) {
            this.sessions.delete(sessionId);
            return null;
        }
        // Update last accessed and extend expiration
        session.last_accessed = Date.now();
        session.expires_at = Date.now() + this.TIMEOUT_MS;
        return session;
    }
    /**
     * Update session
     *
     * Updates conversation context and extends expiration
     *
     * @param sessionId - Session ID
     * @param context - Updated conversation context
     */
    updateSession(sessionId, context) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        // Update context
        session.conversation_context = context;
        session.conversation_context.updated_at = new Date().toISOString();
        // Update last accessed and extend expiration
        session.last_accessed = Date.now();
        session.expires_at = Date.now() + this.TIMEOUT_MS;
    }
    /**
     * Delete session
     *
     * Removes session from storage
     *
     * @param sessionId - Session ID
     */
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    /**
     * Cleanup expired sessions
     *
     * Removes all sessions past expiration time
     */
    cleanup() {
        const now = Date.now();
        const expired = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expires_at) {
                expired.push(sessionId);
            }
        }
        for (const sessionId of expired) {
            this.sessions.delete(sessionId);
        }
        if (expired.length > 0) {
            console.log(`[SessionManager] Cleaned up ${expired.length} expired sessions`);
        }
    }
    /**
     * Evict oldest session
     *
     * Removes least recently accessed session
     */
    evictOldestSession() {
        let oldestId = null;
        let oldestTime = Infinity;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.last_accessed < oldestTime) {
                oldestTime = session.last_accessed;
                oldestId = sessionId;
            }
        }
        if (oldestId) {
            this.sessions.delete(oldestId);
            console.log(`[SessionManager] Evicted oldest session: ${oldestId}`);
        }
    }
    /**
     * Get session count
     *
     * @returns Number of active sessions
     */
    getSessionCount() {
        return this.sessions.size;
    }
    /**
     * Get statistics
     *
     * @returns Session statistics
     */
    getStats() {
        const now = Date.now();
        let oldestAge = 0;
        let newestAge = Infinity;
        let expiredCount = 0;
        for (const session of this.sessions.values()) {
            const age = now - session.created_at;
            if (age > oldestAge)
                oldestAge = age;
            if (age < newestAge)
                newestAge = age;
            if (now > session.expires_at) {
                expiredCount++;
            }
        }
        return {
            total_sessions: this.sessions.size,
            active_sessions: this.sessions.size - expiredCount,
            expired_sessions: expiredCount,
            oldest_session_age_ms: oldestAge,
            newest_session_age_ms: newestAge === Infinity ? 0 : newestAge,
        };
    }
    /**
     * Get all sessions for patient
     *
     * @param patientId - Patient ID
     * @returns Array of sessions for patient
     */
    getSessionsByPatient(patientId) {
        const sessions = [];
        for (const session of this.sessions.values()) {
            if (session.patient_id === patientId && Date.now() <= session.expires_at) {
                sessions.push(session);
            }
        }
        return sessions;
    }
    /**
     * Check if session is expired
     *
     * @param sessionId - Session ID
     * @returns True if session is expired or not found
     */
    isExpired(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return true;
        }
        return Date.now() > session.expires_at;
    }
    /**
     * Get time until expiration
     *
     * @param sessionId - Session ID
     * @returns Milliseconds until expiration, or 0 if expired/not found
     */
    getTimeUntilExpiration(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return 0;
        }
        const timeRemaining = session.expires_at - Date.now();
        return Math.max(0, timeRemaining);
    }
    /**
     * Extend session expiration
     *
     * Extends expiration by another 30 minutes
     *
     * @param sessionId - Session ID
     * @returns True if extended, false if session not found
     */
    extendSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        session.last_accessed = Date.now();
        session.expires_at = Date.now() + this.TIMEOUT_MS;
        return true;
    }
    /**
     * Clear all sessions
     *
     * Removes all sessions (for testing)
     */
    clearAll() {
        this.sessions.clear();
    }
    /**
     * Stop cleanup interval
     *
     * Call when shutting down service
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    /**
     * Explain session manager
     *
     * @returns Explanation string
     */
    explain() {
        return `Session Manager:

Purpose:
Maintain session timeout (30 minutes) per ChatGPT specification.

Features:
- 30-minute session timeout
- Automatic renewal on access
- Automatic cleanup every 5 minutes
- Max 100 sessions (LRU eviction)
- Conversation context storage

Session Lifecycle:
1. Create session → session_id returned
2. Use session_id for follow-up queries
3. Session renewed on each access
4. Session expires after 30 minutes of inactivity
5. Expired sessions cleaned up automatically

Session Storage:
- In-memory Map (session_id → Session)
- Conversation context with turns
- Last entities, temporal filter, intent
- Created/accessed/expires timestamps

Cleanup:
- Runs every 5 minutes
- Removes expired sessions
- Evicts oldest session if max reached

Integration:
1. Client sends session_id with query
2. Server retrieves/renews session
3. Server processes query with context
4. Server updates session with turn
5. Server returns session_id in response

Tech Stack: Node.js + TypeScript ONLY
NO external session libraries`;
    }
}
// Export singleton instance
const sessionManager = new SessionManager();
exports.default = sessionManager;
//# sourceMappingURL=session-manager.service.js.map