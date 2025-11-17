"use strict";
/**
 * Session Manager Examples
 *
 * Demonstrates session timeout management with automatic cleanup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.example1_sessionCreation = example1_sessionCreation;
exports.example2_sessionRetrieval = example2_sessionRetrieval;
exports.example3_sessionExpiration = example3_sessionExpiration;
exports.example4_automaticCleanup = example4_automaticCleanup;
exports.example5_maxSessionLimit = example5_maxSessionLimit;
exports.example6_sessionUpdates = example6_sessionUpdates;
exports.example7_multiPatientSessions = example7_multiPatientSessions;
exports.example8_sessionStatistics = example8_sessionStatistics;
exports.example9_timeUntilExpiration = example9_timeUntilExpiration;
exports.example10_sessionExtension = example10_sessionExtension;
exports.example11_orchestratorIntegration = example11_orchestratorIntegration;
exports.example12_conversationFlow = example12_conversationFlow;
exports.example13_cleanupMechanism = example13_cleanupMechanism;
exports.example14_sessionPersistencePatterns = example14_sessionPersistencePatterns;
exports.example15_explainSessionManager = example15_explainSessionManager;
const session_manager_service_1 = __importDefault(require("../services/session-manager.service"));
/**
 * Example 1: Session Creation
 *
 * Create new session with 30-minute timeout
 */
function example1_sessionCreation() {
    console.log('\n=== Example 1: Session Creation ===\n');
    // Create session for patient
    const session = session_manager_service_1.default.createSession('patient_123');
    console.log('Session created:');
    console.log(`- Session ID: ${session.session_id}`);
    console.log(`- Patient ID: ${session.patient_id}`);
    console.log(`- Created at: ${new Date(session.created_at).toISOString()}`);
    console.log(`- Expires at: ${new Date(session.expires_at).toISOString()}`);
    console.log(`- Timeout: 30 minutes`);
    console.log(`- Conversation turns: ${session.conversation_context.turns.length}`);
    // Output:
    // Session created:
    // - Session ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // - Patient ID: patient_123
    // - Created at: 2025-01-15T10:00:00.000Z
    // - Expires at: 2025-01-15T10:30:00.000Z
    // - Timeout: 30 minutes
    // - Conversation turns: 0
}
/**
 * Example 2: Session Retrieval and Renewal
 *
 * Retrieve session and automatically extend expiration
 */
function example2_sessionRetrieval() {
    console.log('\n=== Example 2: Session Retrieval and Renewal ===\n');
    // Create session
    const session = session_manager_service_1.default.createSession('patient_456');
    console.log(`Session created: ${session.session_id}`);
    console.log(`Initial expiration: ${new Date(session.expires_at).toISOString()}`);
    // Wait 1 second
    setTimeout(() => {
        // Retrieve session - automatically extends expiration
        const retrieved = session_manager_service_1.default.getSession(session.session_id);
        if (retrieved) {
            console.log(`\nSession retrieved: ${retrieved.session_id}`);
            console.log(`New expiration: ${new Date(retrieved.expires_at).toISOString()}`);
            console.log(`Session renewed automatically!`);
        }
    }, 1000);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // Initial expiration: 2025-01-15T10:30:00.000Z
    //
    // Session retrieved: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // New expiration: 2025-01-15T10:30:01.000Z
    // Session renewed automatically!
}
/**
 * Example 3: Session Expiration
 *
 * Check if session has expired
 */
function example3_sessionExpiration() {
    console.log('\n=== Example 3: Session Expiration ===\n');
    // Create session
    const session = session_manager_service_1.default.createSession('patient_789');
    console.log(`Session created: ${session.session_id}`);
    // Manually set expiration to past (for testing)
    session.expires_at = Date.now() - 1000;
    // Try to retrieve expired session
    const retrieved = session_manager_service_1.default.getSession(session.session_id);
    if (retrieved === null) {
        console.log('Session has expired and was automatically deleted');
    }
    // Check expiration status
    const isExpired = session_manager_service_1.default.isExpired(session.session_id);
    console.log(`Is expired: ${isExpired}`);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // Session has expired and was automatically deleted
    // Is expired: true
}
/**
 * Example 4: Automatic Cleanup
 *
 * Cleanup runs every 5 minutes to remove expired sessions
 */
function example4_automaticCleanup() {
    console.log('\n=== Example 4: Automatic Cleanup ===\n');
    // Create multiple sessions
    for (let i = 0; i < 5; i++) {
        session_manager_service_1.default.createSession(`patient_${i}`);
    }
    console.log(`Sessions created: ${session_manager_service_1.default.getSessionCount()}`);
    // Manually expire some sessions (for testing)
    // In production, sessions expire after 30 minutes of inactivity
    // Manually run cleanup
    session_manager_service_1.default.cleanup();
    console.log(`Sessions after cleanup: ${session_manager_service_1.default.getSessionCount()}`);
    // Note: Automatic cleanup runs every 5 minutes via setInterval
    console.log('\nAutomatic cleanup runs every 5 minutes in background');
    // Output:
    // Sessions created: 5
    // Sessions after cleanup: 5
    // Automatic cleanup runs every 5 minutes in background
}
/**
 * Example 5: Max Session Limit and LRU Eviction
 *
 * When 100 sessions reached, evict oldest (least recently accessed)
 */
function example5_maxSessionLimit() {
    console.log('\n=== Example 5: Max Session Limit and LRU Eviction ===\n');
    // Clear all sessions first
    session_manager_service_1.default.clearAll();
    // Create 100 sessions (max limit)
    for (let i = 0; i < 100; i++) {
        session_manager_service_1.default.createSession(`patient_${i}`);
    }
    console.log(`Sessions at max limit: ${session_manager_service_1.default.getSessionCount()}`);
    // Access some sessions to update last_accessed
    session_manager_service_1.default.getSession(session_manager_service_1.default.getSessionsByPatient('patient_50')[0].session_id);
    session_manager_service_1.default.getSession(session_manager_service_1.default.getSessionsByPatient('patient_75')[0].session_id);
    // Create one more session - triggers LRU eviction
    const newSession = session_manager_service_1.default.createSession('patient_101');
    console.log(`\nNew session created: ${newSession.session_id}`);
    console.log(`Sessions after eviction: ${session_manager_service_1.default.getSessionCount()}`);
    console.log('Oldest (least recently accessed) session was evicted');
    // Output:
    // Sessions at max limit: 100
    //
    // New session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // Sessions after eviction: 100
    // Oldest (least recently accessed) session was evicted
}
/**
 * Example 6: Session Updates with Conversation Context
 *
 * Update session with new conversation turn
 */
function example6_sessionUpdates() {
    console.log('\n=== Example 6: Session Updates with Conversation Context ===\n');
    // Create session
    const session = session_manager_service_1.default.createSession('patient_456');
    console.log(`Session created: ${session.session_id}`);
    // Add conversation turn
    const turn = {
        query: "What medications am I on?",
        response: {
            short_answer: "You are currently on Lisinopril and Metformin.",
            detailed_summary: "Your active medications are...",
        },
        timestamp: new Date().toISOString(),
    };
    session.conversation_context.turns.push(turn);
    session.conversation_context.last_intent = 'medication_lookup';
    session.conversation_context.last_entities = [
        { type: 'medication', value: 'Lisinopril' },
        { type: 'medication', value: 'Metformin' },
    ];
    // Update session
    session_manager_service_1.default.updateSession(session.session_id, session.conversation_context);
    console.log('\nSession updated:');
    console.log(`- Turns: ${session.conversation_context.turns.length}`);
    console.log(`- Last intent: ${session.conversation_context.last_intent}`);
    console.log(`- Last entities: ${session.conversation_context.last_entities.length}`);
    console.log(`- Updated at: ${session.conversation_context.updated_at}`);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    //
    // Session updated:
    // - Turns: 1
    // - Last intent: medication_lookup
    // - Last entities: 2
    // - Updated at: 2025-01-15T10:00:00.000Z
}
/**
 * Example 7: Multi-Patient Sessions
 *
 * Get all sessions for specific patient
 */
function example7_multiPatientSessions() {
    console.log('\n=== Example 7: Multi-Patient Sessions ===\n');
    // Clear all sessions
    session_manager_service_1.default.clearAll();
    // Create multiple sessions for same patient
    session_manager_service_1.default.createSession('patient_123');
    session_manager_service_1.default.createSession('patient_123');
    session_manager_service_1.default.createSession('patient_456');
    console.log('Sessions created:');
    console.log(`- Patient 123: 2 sessions`);
    console.log(`- Patient 456: 1 session`);
    // Get all sessions for patient_123
    const patientSessions = session_manager_service_1.default.getSessionsByPatient('patient_123');
    console.log(`\nSessions for patient_123: ${patientSessions.length}`);
    patientSessions.forEach((session, i) => {
        console.log(`  ${i + 1}. ${session.session_id}`);
    });
    // Output:
    // Sessions created:
    // - Patient 123: 2 sessions
    // - Patient 456: 1 session
    //
    // Sessions for patient_123: 2
    //   1. a1b2c3d4-e5f6-7890-abcd-ef1234567890
    //   2. b2c3d4e5-f6g7-8901-bcde-fg2345678901
}
/**
 * Example 8: Session Statistics
 *
 * Get statistics about active sessions
 */
function example8_sessionStatistics() {
    console.log('\n=== Example 8: Session Statistics ===\n');
    // Clear and create sessions
    session_manager_service_1.default.clearAll();
    for (let i = 0; i < 10; i++) {
        session_manager_service_1.default.createSession(`patient_${i}`);
    }
    // Get statistics
    const stats = session_manager_service_1.default.getStats();
    console.log('Session Statistics:');
    console.log(`- Total sessions: ${stats.total_sessions}`);
    console.log(`- Active sessions: ${stats.active_sessions}`);
    console.log(`- Expired sessions: ${stats.expired_sessions}`);
    console.log(`- Oldest session age: ${stats.oldest_session_age_ms}ms`);
    console.log(`- Newest session age: ${stats.newest_session_age_ms}ms`);
    // Output:
    // Session Statistics:
    // - Total sessions: 10
    // - Active sessions: 10
    // - Expired sessions: 0
    // - Oldest session age: 5000ms
    // - Newest session age: 0ms
}
/**
 * Example 9: Time Until Expiration
 *
 * Get remaining time before session expires
 */
function example9_timeUntilExpiration() {
    console.log('\n=== Example 9: Time Until Expiration ===\n');
    // Create session
    const session = session_manager_service_1.default.createSession('patient_789');
    console.log(`Session created: ${session.session_id}`);
    // Get time until expiration
    const timeRemaining = session_manager_service_1.default.getTimeUntilExpiration(session.session_id);
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    console.log(`\nTime until expiration: ${minutes}m ${seconds}s`);
    console.log(`Expiration timestamp: ${new Date(session.expires_at).toISOString()}`);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    //
    // Time until expiration: 29m 59s
    // Expiration timestamp: 2025-01-15T10:30:00.000Z
}
/**
 * Example 10: Session Extension
 *
 * Manually extend session expiration
 */
function example10_sessionExtension() {
    console.log('\n=== Example 10: Session Extension ===\n');
    // Create session
    const session = session_manager_service_1.default.createSession('patient_101');
    console.log(`Session created: ${session.session_id}`);
    console.log(`Initial expiration: ${new Date(session.expires_at).toISOString()}`);
    // Wait 1 second
    setTimeout(() => {
        // Extend session
        const extended = session_manager_service_1.default.extendSession(session.session_id);
        if (extended) {
            const updatedSession = session_manager_service_1.default.getSession(session.session_id);
            console.log(`\nSession extended: ${extended}`);
            console.log(`New expiration: ${new Date(updatedSession.expires_at).toISOString()}`);
            console.log('Session timeout renewed for another 30 minutes');
        }
    }, 1000);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // Initial expiration: 2025-01-15T10:30:00.000Z
    //
    // Session extended: true
    // New expiration: 2025-01-15T10:30:01.000Z
    // Session timeout renewed for another 30 minutes
}
/**
 * Example 11: Integration with Orchestrator
 *
 * Use session manager in query processing pipeline
 */
async function example11_orchestratorIntegration() {
    console.log('\n=== Example 11: Integration with Orchestrator ===\n');
    // Simulated orchestrator function
    async function processQuery(query, patientId, sessionId) {
        // 1. Get or create session
        let session = null;
        if (sessionId) {
            // Try to retrieve existing session
            session = session_manager_service_1.default.getSession(sessionId);
            if (session) {
                console.log(`Using existing session: ${session.session_id}`);
                console.log(`Session has ${session.conversation_context.turns.length} previous turns`);
            }
            else {
                console.log('Session expired or not found, creating new session');
                session = session_manager_service_1.default.createSession(patientId);
            }
        }
        else {
            // No session ID provided, create new session
            console.log('No session ID provided, creating new session');
            session = session_manager_service_1.default.createSession(patientId);
        }
        // 2. Process query with conversation context
        console.log(`\nProcessing query: "${query}"`);
        console.log(`Using context from ${session.conversation_context.turns.length} previous turns`);
        // Simulate query processing
        const response = {
            short_answer: 'Your blood pressure is 120/80 mmHg',
            detailed_summary: 'Based on your recent vitals...',
        };
        // 3. Add turn to conversation context
        const turn = {
            query,
            response,
            timestamp: new Date().toISOString(),
        };
        session.conversation_context.turns.push(turn);
        session.conversation_context.last_intent = 'vital_lookup';
        // 4. Update session
        session_manager_service_1.default.updateSession(session.session_id, session.conversation_context);
        console.log(`\nSession updated with new turn`);
        console.log(`Total turns: ${session.conversation_context.turns.length}`);
        // 5. Return response with session_id
        return {
            ...response,
            session_id: session.session_id,
            metadata: {
                session_turns: session.conversation_context.turns.length,
                session_expires_at: new Date(session.expires_at).toISOString(),
            },
        };
    }
    // First query - no session
    const response1 = await processQuery("What's my blood pressure?", 'patient_123');
    console.log(`\nResponse: ${response1.short_answer}`);
    console.log(`Session ID: ${response1.session_id}`);
    // Follow-up query - with session
    const response2 = await processQuery("What about my heart rate?", 'patient_123', response1.session_id);
    console.log(`\nResponse: ${response2.short_answer}`);
    console.log(`Session ID: ${response2.session_id}`);
    // Output:
    // No session ID provided, creating new session
    //
    // Processing query: "What's my blood pressure?"
    // Using context from 0 previous turns
    //
    // Session updated with new turn
    // Total turns: 1
    //
    // Response: Your blood pressure is 120/80 mmHg
    // Session ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    //
    // Using existing session: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // Session has 1 previous turns
    //
    // Processing query: "What about my heart rate?"
    // Using context from 1 previous turns
    //
    // Session updated with new turn
    // Total turns: 2
    //
    // Response: Your blood pressure is 120/80 mmHg
    // Session ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
}
/**
 * Example 12: Real-World Conversation Flow
 *
 * Multi-turn conversation with automatic session renewal
 */
async function example12_conversationFlow() {
    console.log('\n=== Example 12: Real-World Conversation Flow ===\n');
    // Create initial session
    let session = session_manager_service_1.default.createSession('patient_456');
    console.log(`Session created: ${session.session_id}\n`);
    // Turn 1: Initial query
    console.log('Turn 1: "What medications am I taking?"');
    session.conversation_context.turns.push({
        query: "What medications am I taking?",
        response: { short_answer: "You are on Lisinopril and Metformin" },
        timestamp: new Date().toISOString(),
    });
    session.conversation_context.last_intent = 'medication_lookup';
    session_manager_service_1.default.updateSession(session.session_id, session.conversation_context);
    console.log(`Session updated (expires in 30 minutes)\n`);
    // Turn 2: Follow-up query
    session = session_manager_service_1.default.getSession(session.session_id);
    console.log('Turn 2: "What about side effects?"');
    session.conversation_context.turns.push({
        query: "What about side effects?",
        response: { short_answer: "Common side effects include..." },
        timestamp: new Date().toISOString(),
    });
    session.conversation_context.last_intent = 'side_effects_lookup';
    session_manager_service_1.default.updateSession(session.session_id, session.conversation_context);
    console.log(`Session renewed (expires in 30 minutes)\n`);
    // Turn 3: Another follow-up
    session = session_manager_service_1.default.getSession(session.session_id);
    console.log('Turn 3: "When should I take them?"');
    session.conversation_context.turns.push({
        query: "When should I take them?",
        response: { short_answer: "Take Lisinopril in the morning..." },
        timestamp: new Date().toISOString(),
    });
    session.conversation_context.last_intent = 'medication_schedule';
    session_manager_service_1.default.updateSession(session.session_id, session.conversation_context);
    console.log(`Session renewed (expires in 30 minutes)\n`);
    console.log('Conversation Summary:');
    console.log(`- Total turns: ${session.conversation_context.turns.length}`);
    console.log(`- Session ID: ${session.session_id}`);
    console.log(`- Patient ID: ${session.patient_id}`);
    console.log(`- Session expires: ${new Date(session.expires_at).toISOString()}`);
    // Output:
    // Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    //
    // Turn 1: "What medications am I taking?"
    // Session updated (expires in 30 minutes)
    //
    // Turn 2: "What about side effects?"
    // Session renewed (expires in 30 minutes)
    //
    // Turn 3: "When should I take them?"
    // Session renewed (expires in 30 minutes)
    //
    // Conversation Summary:
    // - Total turns: 3
    // - Session ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    // - Patient ID: patient_456
    // - Session expires: 2025-01-15T10:30:00.000Z
}
/**
 * Example 13: Cleanup Mechanism
 *
 * Demonstrate automatic cleanup of expired sessions
 */
function example13_cleanupMechanism() {
    console.log('\n=== Example 13: Cleanup Mechanism ===\n');
    // Clear all sessions
    session_manager_service_1.default.clearAll();
    // Create sessions and manually expire some
    const sessions = [];
    for (let i = 0; i < 5; i++) {
        const session = session_manager_service_1.default.createSession(`patient_${i}`);
        sessions.push(session);
    }
    console.log(`Sessions created: ${session_manager_service_1.default.getSessionCount()}`);
    // Manually expire first 3 sessions (for testing)
    sessions[0].expires_at = Date.now() - 1000;
    sessions[1].expires_at = Date.now() - 1000;
    sessions[2].expires_at = Date.now() - 1000;
    console.log('Manually expired 3 sessions for testing\n');
    // Run cleanup
    session_manager_service_1.default.cleanup();
    console.log(`Sessions after cleanup: ${session_manager_service_1.default.getSessionCount()}`);
    console.log('3 expired sessions removed');
    console.log('\nIn production:');
    console.log('- Cleanup runs automatically every 5 minutes');
    console.log('- Sessions expire after 30 minutes of inactivity');
    console.log('- No manual intervention required');
    // Output:
    // Sessions created: 5
    // Manually expired 3 sessions for testing
    //
    // [SessionManager] Cleaned up 3 expired sessions
    // Sessions after cleanup: 2
    // 3 expired sessions removed
    //
    // In production:
    // - Cleanup runs automatically every 5 minutes
    // - Sessions expire after 30 minutes of inactivity
    // - No manual intervention required
}
/**
 * Example 14: Session Persistence Patterns
 *
 * Best practices for session management
 */
function example14_sessionPersistencePatterns() {
    console.log('\n=== Example 14: Session Persistence Patterns ===\n');
    console.log('Pattern 1: Client-Side Session ID Storage');
    console.log('- Store session_id in client (localStorage, cookie)');
    console.log('- Send with each request');
    console.log('- Create new session if expired/missing\n');
    console.log('Pattern 2: Session Renewal on Every Request');
    console.log('- getSession() automatically renews expiration');
    console.log('- Active users never lose session');
    console.log('- 30-minute inactivity timeout\n');
    console.log('Pattern 3: Graceful Session Expiration');
    console.log('- Check if session exists before use');
    console.log('- Create new session if expired');
    console.log('- Inform user if conversation context lost\n');
    console.log('Example Implementation:');
    console.log('async function handleRequest(query, patientId, sessionId) {');
    console.log('  let session = sessionId ? sessionManager.getSession(sessionId) : null;');
    console.log('  if (!session) session = sessionManager.createSession(patientId);');
    console.log('  // ... process query with session context');
    console.log('  return { response, session_id: session.session_id };');
    console.log('}');
}
/**
 * Example 15: Explain Session Manager
 *
 * Get detailed explanation of session management
 */
function example15_explainSessionManager() {
    console.log('\n=== Example 15: Explain Session Manager ===\n');
    const explanation = session_manager_service_1.default.explain();
    console.log(explanation);
    // Output:
    // Session Manager:
    //
    // Purpose:
    // Maintain session timeout (30 minutes) per ChatGPT specification.
    //
    // Features:
    // - 30-minute session timeout
    // - Automatic renewal on access
    // - Automatic cleanup every 5 minutes
    // - Max 100 sessions (LRU eviction)
    // - Conversation context storage
    //
    // Session Lifecycle:
    // 1. Create session → session_id returned
    // 2. Use session_id for follow-up queries
    // 3. Session renewed on each access
    // 4. Session expires after 30 minutes of inactivity
    // 5. Expired sessions cleaned up automatically
    //
    // Session Storage:
    // - In-memory Map (session_id → Session)
    // - Conversation context with turns
    // - Last entities, temporal filter, intent
    // - Created/accessed/expires timestamps
    //
    // Cleanup:
    // - Runs every 5 minutes
    // - Removes expired sessions
    // - Evicts oldest session if max reached
    //
    // Integration:
    // 1. Client sends session_id with query
    // 2. Server retrieves/renews session
    // 3. Server processes query with context
    // 4. Server updates session with turn
    // 5. Server returns session_id in response
    //
    // Tech Stack: Node.js + TypeScript ONLY
    // NO external session libraries
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('========================================');
    console.log('SESSION MANAGER EXAMPLES');
    console.log('========================================');
    example1_sessionCreation();
    example2_sessionRetrieval();
    example3_sessionExpiration();
    example4_automaticCleanup();
    example5_maxSessionLimit();
    example6_sessionUpdates();
    example7_multiPatientSessions();
    example8_sessionStatistics();
    example9_timeUntilExpiration();
    example10_sessionExtension();
    await example11_orchestratorIntegration();
    await example12_conversationFlow();
    example13_cleanupMechanism();
    example14_sessionPersistencePatterns();
    example15_explainSessionManager();
    console.log('\n========================================');
    console.log('ALL EXAMPLES COMPLETED');
    console.log('========================================\n');
}
// Run examples if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=session-manager.example.js.map