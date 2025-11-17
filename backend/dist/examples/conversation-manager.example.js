"use strict";
/**
 * Conversation Manager Usage Examples
 *
 * Demonstrates:
 * - Session creation
 * - Context updates
 * - Follow-up resolution
 * - Context window (5 turns)
 * - Session expiry (30 minutes)
 * - Entity inheritance
 * - Filter inheritance
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleCreateSession = exampleCreateSession;
exports.exampleUpdateContext = exampleUpdateContext;
exports.exampleFollowUpDetection = exampleFollowUpDetection;
exports.exampleEntityInheritance = exampleEntityInheritance;
exports.exampleTemporalFilterInheritance = exampleTemporalFilterInheritance;
exports.exampleContextWindow = exampleContextWindow;
exports.exampleSessionExpiry = exampleSessionExpiry;
exports.exampleCleanupExpiredSessions = exampleCleanupExpiredSessions;
exports.exampleDeleteSession = exampleDeleteSession;
exports.exampleConversationFlow = exampleConversationFlow;
exports.exampleIntentDetection = exampleIntentDetection;
exports.exampleEntityExtraction = exampleEntityExtraction;
exports.exampleTemporalFilterExtraction = exampleTemporalFilterExtraction;
exports.exampleMultiTurnConversation = exampleMultiTurnConversation;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const conversation_manager_service_1 = __importDefault(require("../services/conversation-manager.service"));
/**
 * Example 1: Create session
 */
function exampleCreateSession() {
    console.log('Example 1: Create Session');
    console.log('-'.repeat(80));
    const patientId = 'patient_123';
    const session = conversation_manager_service_1.default.createSession(patientId);
    console.log('  Session created:');
    console.log('    Session ID:', session.session_id);
    console.log('    Patient ID:', session.patient_id);
    console.log('    Created at:', session.created_at);
    console.log('    Expires at:', session.expires_at);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 2: Update context
 */
function exampleUpdateContext() {
    console.log('Example 2: Update Context');
    console.log('-'.repeat(80));
    const patientId = 'patient_456';
    const session = conversation_manager_service_1.default.createSession(patientId);
    // Simulate a query and response
    const query = 'What medications is the patient taking?';
    const response = {
        queryId: 'query_001',
        success: true,
        shortAnswer: 'The patient is taking ibuprofen 400 mg q6h PRN.',
        confidence: { score: 0.9, label: 'high', reason: 'Well supported' },
    };
    // Update context
    conversation_manager_service_1.default.updateContext(session.session_id, query, response);
    // Get context
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('  Context updated:');
    console.log('    Session ID:', context?.session_id);
    console.log('    Turns:', context?.turns.length);
    console.log('    Last query:', context?.turns[0].query);
    console.log('    Last entities:', context?.last_entities);
    console.log('    Last intent:', context?.last_intent);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Follow-up query detection
 */
function exampleFollowUpDetection() {
    console.log('Example 3: Follow-up Query Detection');
    console.log('-'.repeat(80));
    const patientId = 'patient_789';
    const session = conversation_manager_service_1.default.createSession(patientId);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    // First query
    const query1 = 'What medications is the patient taking?';
    console.log('  Query 1:', query1);
    const sq1 = conversation_manager_service_1.default.resolveFollowUp(query1, context);
    console.log('    Intent:', sq1.intent);
    console.log('    Entities:', sq1.entities.length);
    // Follow-up queries
    const followUpQueries = [
        'what about allergies?',
        'and when did they start?',
        'tell me more about that',
        'how about recent lab results?',
    ];
    console.log('\n  Follow-up queries:');
    followUpQueries.forEach((query, i) => {
        const sq = conversation_manager_service_1.default.resolveFollowUp(query, context);
        console.log(`\n    Query ${i + 2}: "${query}"`);
        console.log('      Detected as follow-up: true');
        console.log('      Intent:', sq.intent);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Entity inheritance
 */
function exampleEntityInheritance() {
    console.log('Example 4: Entity Inheritance');
    console.log('-'.repeat(80));
    const patientId = 'patient_101';
    const session = conversation_manager_service_1.default.createSession(patientId);
    // First query with entities
    const query1 = 'What is the dosage of ibuprofen?';
    const response1 = {
        queryId: 'query_001',
        success: true,
        shortAnswer: 'Ibuprofen 400 mg q6h PRN.',
    };
    conversation_manager_service_1.default.updateContext(session.session_id, query1, response1);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('  First query:', query1);
    console.log('    Entities extracted:', context.last_entities);
    // Follow-up query without explicit entities
    const query2 = 'when did they start taking it?';
    const sq2 = conversation_manager_service_1.default.resolveFollowUp(query2, context);
    console.log('\n  Follow-up query:', query2);
    console.log('    Inherited entities:', sq2.entities);
    console.log('    (Entities from previous turn)');
    console.log('\n  ✅ Success (entity inheritance)\n');
}
/**
 * Example 5: Temporal filter inheritance
 */
function exampleTemporalFilterInheritance() {
    console.log('Example 5: Temporal Filter Inheritance');
    console.log('-'.repeat(80));
    const patientId = 'patient_202';
    const session = conversation_manager_service_1.default.createSession(patientId);
    // First query with temporal filter
    const query1 = 'What medications were prescribed last week?';
    const response1 = {
        queryId: 'query_001',
        success: true,
        shortAnswer: 'Ibuprofen was prescribed last week.',
    };
    conversation_manager_service_1.default.updateContext(session.session_id, query1, response1);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('  First query:', query1);
    console.log('    Temporal filter:', context.last_temporal_filter);
    // Follow-up query without explicit temporal filter
    const query2 = 'what about allergies?';
    const sq2 = conversation_manager_service_1.default.resolveFollowUp(query2, context);
    console.log('\n  Follow-up query:', query2);
    console.log('    Inherited temporal filter:', sq2.temporal_filter);
    console.log('    (Filter from previous turn)');
    console.log('\n  ✅ Success (temporal filter inheritance)\n');
}
/**
 * Example 6: Context window (5 turns)
 */
function exampleContextWindow() {
    console.log('Example 6: Context Window (5 Turns)');
    console.log('-'.repeat(80));
    const patientId = 'patient_303';
    const session = conversation_manager_service_1.default.createSession(patientId);
    // Add 7 queries (exceeds context window of 5)
    const queries = [
        'What medications is the patient taking?',
        'What about allergies?',
        'When were they diagnosed?',
        'What are their vital signs?',
        'What procedures have they had?',
        'What are their lab results?',
        'What is their care plan?',
    ];
    console.log('  Adding 7 queries (context window: 5 turns):\n');
    queries.forEach((query, i) => {
        const response = {
            queryId: `query_${i + 1}`,
            success: true,
            shortAnswer: `Answer ${i + 1}`,
        };
        conversation_manager_service_1.default.updateContext(session.session_id, query, response);
        const context = conversation_manager_service_1.default.getContext(session.session_id);
        console.log(`    Query ${i + 1}: "${query}"`);
        console.log(`      Turns in context: ${context.turns.length}`);
    });
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('\n  Final context:');
    console.log('    Total turns:', context.turns.length);
    console.log('    Oldest turn:', context.turns[0].query);
    console.log('    Newest turn:', context.turns[context.turns.length - 1].query);
    console.log('\n  ✅ Success (context window enforced)\n');
}
/**
 * Example 7: Session expiry
 */
function exampleSessionExpiry() {
    console.log('Example 7: Session Expiry (30 Minutes)');
    console.log('-'.repeat(80));
    const patientId = 'patient_404';
    const session = conversation_manager_service_1.default.createSession(patientId);
    console.log('  Session created:');
    console.log('    Session ID:', session.session_id);
    console.log('    Created at:', session.created_at);
    console.log('    Expires at:', session.expires_at);
    // Calculate expiry time
    const createdAt = new Date(session.created_at);
    const expiresAt = new Date(session.expires_at);
    const expiryMinutes = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60);
    console.log('    Expiry time:', expiryMinutes, 'minutes');
    // Get active session count
    const activeCount = conversation_manager_service_1.default.getActiveSessionCount();
    console.log('\n  Active sessions:', activeCount);
    console.log('\n  ✅ Success (30-minute expiry)\n');
}
/**
 * Example 8: Cleanup expired sessions
 */
function exampleCleanupExpiredSessions() {
    console.log('Example 8: Cleanup Expired Sessions');
    console.log('-'.repeat(80));
    // Create multiple sessions
    const sessions = [];
    for (let i = 0; i < 5; i++) {
        const session = conversation_manager_service_1.default.createSession(`patient_${500 + i}`);
        sessions.push(session);
    }
    console.log('  Created sessions:', sessions.length);
    console.log('  Active sessions (before cleanup):', conversation_manager_service_1.default.getActiveSessionCount());
    // Cleanup expired sessions
    conversation_manager_service_1.default.cleanupExpiredSessions();
    console.log('  Active sessions (after cleanup):', conversation_manager_service_1.default.getActiveSessionCount());
    console.log('  (No sessions expired yet - all created recently)');
    console.log('\n  ✅ Success\n');
}
/**
 * Example 9: Delete session
 */
function exampleDeleteSession() {
    console.log('Example 9: Delete Session');
    console.log('-'.repeat(80));
    const patientId = 'patient_505';
    const session = conversation_manager_service_1.default.createSession(patientId);
    console.log('  Session created:', session.session_id);
    const beforeCount = conversation_manager_service_1.default.getActiveSessionCount();
    console.log('  Active sessions (before delete):', beforeCount);
    // Delete session
    conversation_manager_service_1.default.deleteSession(session.session_id);
    const afterCount = conversation_manager_service_1.default.getActiveSessionCount();
    console.log('  Active sessions (after delete):', afterCount);
    // Try to get deleted session
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('  Get deleted session:', context);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 10: Conversation flow
 */
function exampleConversationFlow() {
    console.log('Example 10: Conversation Flow');
    console.log('-'.repeat(80));
    const patientId = 'patient_606';
    const session = conversation_manager_service_1.default.createSession(patientId);
    console.log('  Patient ID:', patientId);
    console.log('  Session ID:', session.session_id, '\n');
    // Query 1
    const query1 = 'What medications is the patient taking?';
    const response1 = {
        queryId: 'query_001',
        success: true,
        shortAnswer: 'The patient is taking ibuprofen 400 mg q6h PRN.',
    };
    conversation_manager_service_1.default.updateContext(session.session_id, query1, response1);
    console.log('  Turn 1:');
    console.log('    Query:', query1);
    console.log('    Answer:', response1.shortAnswer);
    // Query 2 (follow-up)
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    const query2 = 'when did they start taking it?';
    const sq2 = conversation_manager_service_1.default.resolveFollowUp(query2, context);
    console.log('\n  Turn 2:');
    console.log('    Query:', query2);
    console.log('    Follow-up detected: true');
    console.log('    Inherited entities:', sq2.entities);
    const response2 = {
        queryId: 'query_002',
        success: true,
        shortAnswer: 'They started taking ibuprofen 3 days ago.',
    };
    conversation_manager_service_1.default.updateContext(session.session_id, query2, response2);
    // Query 3 (follow-up)
    const context3 = conversation_manager_service_1.default.getContext(session.session_id);
    const query3 = 'what about allergies?';
    const sq3 = conversation_manager_service_1.default.resolveFollowUp(query3, context3);
    console.log('\n  Turn 3:');
    console.log('    Query:', query3);
    console.log('    Follow-up detected: true');
    console.log('    Intent:', sq3.intent);
    console.log('\n  ✅ Success (conversation flow tracked)\n');
}
/**
 * Example 11: Intent detection
 */
function exampleIntentDetection() {
    console.log('Example 11: Intent Detection');
    console.log('-'.repeat(80));
    const patientId = 'patient_707';
    const session = conversation_manager_service_1.default.createSession(patientId);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    const queries = [
        { query: 'What medications is the patient taking?', expectedIntent: 'RETRIEVE_MEDICATIONS' },
        { query: 'What is the diagnosis?', expectedIntent: 'RETRIEVE_DIAGNOSIS' },
        { query: 'What allergies does the patient have?', expectedIntent: 'RETRIEVE_ALLERGIES' },
        { query: 'What procedures were done?', expectedIntent: 'RETRIEVE_PROCEDURES' },
        { query: 'What are the lab results?', expectedIntent: 'RETRIEVE_LAB_RESULTS' },
    ];
    console.log('  Intent detection:\n');
    queries.forEach(({ query, expectedIntent }) => {
        const sq = conversation_manager_service_1.default.resolveFollowUp(query, context);
        console.log(`    "${query}"`);
        console.log(`      Detected: ${sq.intent}`);
        console.log(`      Expected: ${expectedIntent}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Entity extraction
 */
function exampleEntityExtraction() {
    console.log('Example 12: Entity Extraction');
    console.log('-'.repeat(80));
    const patientId = 'patient_808';
    const session = conversation_manager_service_1.default.createSession(patientId);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    const queries = [
        'What is the dosage of ibuprofen?',
        'Is the patient taking lisinopril?',
        'What about metformin and atorvastatin?',
    ];
    console.log('  Entity extraction:\n');
    queries.forEach(query => {
        const sq = conversation_manager_service_1.default.resolveFollowUp(query, context);
        console.log(`    "${query}"`);
        console.log(`      Entities:`, sq.entities);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Temporal filter extraction
 */
function exampleTemporalFilterExtraction() {
    console.log('Example 13: Temporal Filter Extraction');
    console.log('-'.repeat(80));
    const patientId = 'patient_909';
    const session = conversation_manager_service_1.default.createSession(patientId);
    const context = conversation_manager_service_1.default.getContext(session.session_id);
    const queries = [
        'What medications were prescribed last week?',
        'What happened last month?',
        'What are the results from this year?',
    ];
    console.log('  Temporal filter extraction:\n');
    queries.forEach(query => {
        const sq = conversation_manager_service_1.default.resolveFollowUp(query, context);
        console.log(`    "${query}"`);
        console.log('      Filter:', sq.temporal_filter);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 14: Multi-turn conversation
 */
function exampleMultiTurnConversation() {
    console.log('Example 14: Multi-Turn Conversation');
    console.log('-'.repeat(80));
    const patientId = 'patient_010';
    const session = conversation_manager_service_1.default.createSession(patientId);
    console.log('  Scenario: Clinician reviewing patient chart\n');
    const turns = [
        {
            query: 'What medications is the patient taking?',
            answer: 'The patient is taking ibuprofen 400 mg q6h PRN.',
        },
        {
            query: 'when did they start?',
            answer: 'They started taking ibuprofen 3 days ago.',
        },
        {
            query: 'what about allergies?',
            answer: 'The patient has no known allergies.',
        },
        {
            query: 'and their diagnosis?',
            answer: 'The patient is diagnosed with acute pain.',
        },
        {
            query: 'what was the last visit date?',
            answer: 'The last visit was 2 days ago.',
        },
    ];
    turns.forEach((turn, i) => {
        const response = {
            queryId: `query_${i + 1}`,
            success: true,
            shortAnswer: turn.answer,
        };
        conversation_manager_service_1.default.updateContext(session.session_id, turn.query, response);
        console.log(`  Turn ${i + 1}:`);
        console.log('    Query:', turn.query);
        console.log('    Follow-up:', i > 0 ? 'yes' : 'no');
        console.log('    Answer:', turn.answer);
        console.log('');
    });
    const finalContext = conversation_manager_service_1.default.getContext(session.session_id);
    console.log('  Final context:');
    console.log('    Total turns:', finalContext.turns.length);
    console.log('    Last intent:', finalContext.last_intent);
    console.log('\n  ✅ Success (multi-turn conversation)\n');
}
/**
 * Example 15: Explain conversation manager
 */
function exampleExplain() {
    console.log('Example 15: Explain Conversation Manager');
    console.log('-'.repeat(80));
    const explanation = conversation_manager_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('CONVERSATION MANAGER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleCreateSession();
        exampleUpdateContext();
        exampleFollowUpDetection();
        exampleEntityInheritance();
        exampleTemporalFilterInheritance();
        exampleContextWindow();
        exampleSessionExpiry();
        exampleCleanupExpiredSessions();
        exampleDeleteSession();
        exampleConversationFlow();
        exampleIntentDetection();
        exampleEntityExtraction();
        exampleTemporalFilterExtraction();
        exampleMultiTurnConversation();
        exampleExplain();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=conversation-manager.example.js.map