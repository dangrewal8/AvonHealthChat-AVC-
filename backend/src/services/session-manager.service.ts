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

import { v4 as uuidv4 } from 'uuid';

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
class SessionManager {
  /**
   * Active sessions
   */
  private sessions: Map<string, Session> = new Map();

  /**
   * Session timeout (30 minutes)
   */
  private readonly TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Maximum sessions
   */
  private readonly MAX_SESSIONS = 100;

  /**
   * Cleanup interval (5 minutes)
   */
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Cleanup interval handle
   */
  private cleanupInterval: NodeJS.Timeout;

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
  createSession(patientId: string): Session {
    const now = Date.now();
    const session: Session = {
      session_id: uuidv4(),
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
  getSession(sessionId: string): Session | null {
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
  updateSession(sessionId: string, context: ConversationContext): void {
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
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Cleanup expired sessions
   *
   * Removes all sessions past expiration time
   */
  cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

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
  private evictOldestSession(): void {
    let oldestId: string | null = null;
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
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get statistics
   *
   * @returns Session statistics
   */
  getStats(): SessionStats {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = Infinity;
    let expiredCount = 0;

    for (const session of this.sessions.values()) {
      const age = now - session.created_at;

      if (age > oldestAge) oldestAge = age;
      if (age < newestAge) newestAge = age;

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
  getSessionsByPatient(patientId: string): Session[] {
    const sessions: Session[] = [];

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
  isExpired(sessionId: string): boolean {
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
  getTimeUntilExpiration(sessionId: string): number {
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
  extendSession(sessionId: string): boolean {
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
  clearAll(): void {
    this.sessions.clear();
  }

  /**
   * Stop cleanup interval
   *
   * Call when shutting down service
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Explain session manager
   *
   * @returns Explanation string
   */
  explain(): string {
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
export default sessionManager;
