"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/**
 * Conversation Manager Class
 *
 * Manages conversation context for follow-up queries
 */
class ConversationManager {
    /**
     * Context window size (keep last 5 turns)
     */
    CONTEXT_WINDOW_SIZE = 5;
    /**
     * Session expiry time (30 minutes in milliseconds)
     */
    SESSION_EXPIRY_MS = 30 * 60 * 1000;
    /**
     * Active sessions (in-memory store)
     * In production: use Redis or database
     */
    sessions = new Map();
    /**
     * Create new conversation session
     *
     * @param patientId - Patient ID
     * @returns Session
     */
    createSession(patientId) {
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRY_MS);
        // Initialize conversation context
        const context = {
            session_id: sessionId,
            patient_id: patientId,
            turns: [],
            last_entities: [],
            last_temporal_filter: null,
            last_intent: null,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
        };
        // Store session
        this.sessions.set(sessionId, context);
        return {
            session_id: sessionId,
            patient_id: patientId,
            created_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
        };
    }
    /**
     * Update conversation context
     *
     * @param sessionId - Session ID
     * @param query - User query
     * @param response - UI response from orchestrator
     */
    updateContext(sessionId, query, response) {
        const context = this.sessions.get(sessionId);
        if (!context) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        // Check session expiry
        const createdAt = new Date(context.created_at);
        const now = new Date();
        const age = now.getTime() - createdAt.getTime();
        if (age > this.SESSION_EXPIRY_MS) {
            this.sessions.delete(sessionId);
            throw new Error(`Session expired: ${sessionId}`);
        }
        // Create structured query from response metadata
        // In production: this would come from QUA agent
        const structuredQuery = {
            original_query: query,
            patient_id: context.patient_id,
            intent: context.last_intent || 'RETRIEVE_GENERAL',
            entities: this.extractEntities(query),
            temporal_filter: this.extractTemporalFilter(query),
            processed_at: new Date().toISOString(),
        };
        // Create conversation turn
        const turn = {
            query,
            structured_query: structuredQuery,
            response,
            timestamp: new Date().toISOString(),
        };
        // Add turn to context
        context.turns.push(turn);
        // Keep only last N turns (context window)
        if (context.turns.length > this.CONTEXT_WINDOW_SIZE) {
            context.turns = context.turns.slice(-this.CONTEXT_WINDOW_SIZE);
        }
        // Update last entities, filter, and intent
        context.last_entities = structuredQuery.entities;
        context.last_temporal_filter = structuredQuery.temporal_filter;
        context.last_intent = structuredQuery.intent;
        context.updated_at = new Date().toISOString();
        // Update session
        this.sessions.set(sessionId, context);
    }
    /**
     * Resolve follow-up query
     *
     * Detects follow-up queries and inherits context from previous turn
     *
     * @param query - User query
     * @param context - Conversation context
     * @returns Structured query with inherited context
     */
    resolveFollowUp(query, context) {
        // Check if query is a follow-up
        const isFollowUp = this.detectFollowUp(query);
        if (!isFollowUp || context.turns.length === 0) {
            // Not a follow-up, process as new query
            return {
                original_query: query,
                patient_id: context.patient_id,
                intent: this.detectIntent(query),
                entities: this.extractEntities(query),
                temporal_filter: this.extractTemporalFilter(query),
                processed_at: new Date().toISOString(),
            };
        }
        // Follow-up query: inherit context from previous turn
        // Extract new entities from current query
        const newEntities = this.extractEntities(query);
        // Merge entities (keep last entities if no new ones)
        const mergedEntities = newEntities.length > 0 ? newEntities : context.last_entities;
        // Extract temporal filter (use new if present, else inherit)
        const newTemporalFilter = this.extractTemporalFilter(query);
        const mergedTemporalFilter = newTemporalFilter || context.last_temporal_filter;
        // Detect intent (use new if present, else inherit)
        const newIntent = this.detectIntent(query);
        const mergedIntent = newIntent || context.last_intent;
        return {
            original_query: query,
            patient_id: context.patient_id,
            intent: mergedIntent,
            entities: mergedEntities,
            temporal_filter: mergedTemporalFilter,
            processed_at: new Date().toISOString(),
        };
    }
    /**
     * Get conversation context
     *
     * @param sessionId - Session ID
     * @returns Conversation context
     */
    getContext(sessionId) {
        const context = this.sessions.get(sessionId);
        if (!context) {
            return null;
        }
        // Check session expiry
        const createdAt = new Date(context.created_at);
        const now = new Date();
        const age = now.getTime() - createdAt.getTime();
        if (age > this.SESSION_EXPIRY_MS) {
            this.sessions.delete(sessionId);
            return null;
        }
        return context;
    }
    /**
     * Delete session
     *
     * @param sessionId - Session ID
     */
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    /**
     * Clean up expired sessions
     *
     * Should be called periodically (e.g., every 5 minutes)
     */
    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, context] of this.sessions.entries()) {
            const createdAt = new Date(context.created_at);
            const age = now.getTime() - createdAt.getTime();
            if (age > this.SESSION_EXPIRY_MS) {
                this.sessions.delete(sessionId);
            }
        }
    }
    /**
     * Get active session count
     *
     * @returns Number of active sessions
     */
    getActiveSessionCount() {
        return this.sessions.size;
    }
    /**
     * Detect follow-up query
     *
     * Checks for follow-up patterns like "what about...", "and...", "when did..."
     *
     * @param query - User query
     * @returns True if query is a follow-up
     */
    detectFollowUp(query) {
        const lowerQuery = query.toLowerCase().trim();
        // Follow-up patterns
        const followUpPatterns = [
            /^what about/,
            /^and /,
            /^when did/,
            /^how about/,
            /^also /,
            /^additionally/,
            /^furthermore/,
            /^moreover/,
            /^besides/,
            /^in addition/,
            /^what else/,
            /^any other/,
            /^tell me more/,
            /^more details/,
            /^continue/,
            /^go on/,
        ];
        return followUpPatterns.some(pattern => pattern.test(lowerQuery));
    }
    /**
     * Detect query intent
     *
     * Simple keyword-based intent detection
     * In production: use ML model or NLU service
     *
     * @param query - User query
     * @returns Query intent
     */
    detectIntent(query) {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('medication') || lowerQuery.includes('drug')) {
            return 'RETRIEVE_MEDICATIONS';
        }
        else if (lowerQuery.includes('diagnosis') || lowerQuery.includes('condition')) {
            return 'RETRIEVE_DIAGNOSIS';
        }
        else if (lowerQuery.includes('allerg')) {
            return 'RETRIEVE_ALLERGIES';
        }
        else if (lowerQuery.includes('procedure') || lowerQuery.includes('surgery')) {
            return 'RETRIEVE_PROCEDURES';
        }
        else if (lowerQuery.includes('lab') || lowerQuery.includes('test')) {
            return 'RETRIEVE_LAB_RESULTS';
        }
        else if (lowerQuery.includes('vital') || lowerQuery.includes('blood pressure')) {
            return 'RETRIEVE_VITALS';
        }
        else if (lowerQuery.includes('immunization') || lowerQuery.includes('vaccine')) {
            return 'RETRIEVE_IMMUNIZATIONS';
        }
        else if (lowerQuery.includes('care plan')) {
            return 'RETRIEVE_CARE_PLAN';
        }
        else if (lowerQuery.includes('progress note')) {
            return 'RETRIEVE_PROGRESS_NOTES';
        }
        return null;
    }
    /**
     * Extract entities from query
     *
     * Simple pattern matching for demo
     * In production: use NER model
     *
     * @param query - User query
     * @returns Entities
     */
    extractEntities(query) {
        const entities = [];
        // Medication entities
        const medications = ['ibuprofen', 'lisinopril', 'metformin', 'atorvastatin'];
        for (const med of medications) {
            if (query.toLowerCase().includes(med)) {
                entities.push({
                    text: med,
                    type: 'medication',
                    confidence: 0.9,
                });
            }
        }
        // Condition entities
        const conditions = ['diabetes', 'hypertension', 'asthma'];
        for (const condition of conditions) {
            if (query.toLowerCase().includes(condition)) {
                entities.push({
                    text: condition,
                    type: 'condition',
                    confidence: 0.85,
                });
            }
        }
        return entities;
    }
    /**
     * Extract temporal filter from query
     *
     * Simple pattern matching for demo
     * In production: use temporal expression parser
     *
     * @param query - User query
     * @returns Temporal filter
     */
    extractTemporalFilter(query) {
        const lowerQuery = query.toLowerCase();
        // Relative periods
        if (lowerQuery.includes('last week')) {
            return {
                type: 'relative',
                relative_period: 'last_week',
            };
        }
        else if (lowerQuery.includes('last month')) {
            return {
                type: 'relative',
                relative_period: 'last_month',
            };
        }
        else if (lowerQuery.includes('last year')) {
            return {
                type: 'relative',
                relative_period: 'last_year',
            };
        }
        else if (lowerQuery.includes('this week')) {
            return {
                type: 'relative',
                relative_period: 'this_week',
            };
        }
        else if (lowerQuery.includes('this month')) {
            return {
                type: 'relative',
                relative_period: 'this_month',
            };
        }
        else if (lowerQuery.includes('this year')) {
            return {
                type: 'relative',
                relative_period: 'this_year',
            };
        }
        // Absolute dates (simple detection)
        const datePattern = /\d{4}-\d{2}-\d{2}/;
        const matches = query.match(datePattern);
        if (matches && matches.length > 0) {
            return {
                type: 'absolute',
                start: matches[0],
                end: matches[1] || matches[0],
            };
        }
        return null;
    }
    /**
     * Explain conversation manager
     *
     * @returns Explanation string
     */
    explain() {
        return `Conversation Manager:

Features:
- Session management
- Follow-up query resolution
- Context window (last 5 turns)
- Session expiry (30 minutes)
- Entity and filter inheritance

Session Management:
  const session = conversationManager.createSession(patientId);

Context Updates:
  conversationManager.updateContext(sessionId, query, response);

Follow-up Resolution:
  const context = conversationManager.getContext(sessionId);
  const structuredQuery = conversationManager.resolveFollowUp(query, context);

Follow-up Patterns:
- "what about..."
- "and..."
- "when did..."
- "how about..."
- "also..."

Context Inheritance:
- Entities: Inherit from previous turn if not specified
- Temporal filter: Inherit from previous turn if not specified
- Intent: Inherit from previous turn if not specified

Tech Stack: Node.js + TypeScript ONLY`;
    }
}
// Export singleton instance
const conversationManager = new ConversationManager();
exports.default = conversationManager;
//# sourceMappingURL=conversation-manager.service.js.map