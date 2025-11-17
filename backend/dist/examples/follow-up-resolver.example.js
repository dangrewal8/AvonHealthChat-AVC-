"use strict";
/**
 * Follow-Up Resolver Usage Examples
 *
 * Demonstrates:
 * - Follow-up detection using pattern matching
 * - Context merging (entities, temporal filters, intent)
 * - Entity inheritance from previous queries
 * - Temporal filter updates
 * - Intent preservation
 * - Real-world conversation flows
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicDetection = exampleBasicDetection;
exports.exampleContextMerging = exampleContextMerging;
exports.exampleEntityInheritance = exampleEntityInheritance;
exports.exampleTemporalInheritance = exampleTemporalInheritance;
exports.exampleIntentPreservation = exampleIntentPreservation;
exports.exampleFollowUpResolution = exampleFollowUpResolution;
exports.exampleFollowUpChain = exampleFollowUpChain;
exports.exampleFollowUpPatterns = exampleFollowUpPatterns;
exports.exampleMedicationConversation = exampleMedicationConversation;
exports.exampleLabResultsConversation = exampleLabResultsConversation;
exports.exampleEdgeCases = exampleEdgeCases;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const follow_up_resolver_service_1 = __importStar(require("../services/follow-up-resolver.service"));
/**
 * Example 1: Basic follow-up detection
 */
function exampleBasicDetection() {
    console.log('Example 1: Basic Follow-Up Detection');
    console.log('-'.repeat(80));
    const queries = [
        'What medications did I prescribe last month?',
        'And what about this week?',
        'Also lab results?',
        'What about blood pressure?',
        'How about this year?',
        'When did I prescribe that?',
        'This medication?',
        'Last week',
        'Yes',
    ];
    console.log('  Testing follow-up detection:\n');
    queries.forEach(query => {
        const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(query);
        console.log(`    "${query}"`);
        console.log(`      → ${isFollowUp ? 'FOLLOW-UP' : 'NEW QUERY'}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 2: Context merging
 */
function exampleContextMerging() {
    console.log('Example 2: Context Merging');
    console.log('-'.repeat(80));
    // Previous query
    const previousQuery = {
        original_query: 'What medications did I prescribe last month?',
        patient_id: 'patient_123',
        intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [
            { type: 'medication', value: 'medication', normalized: 'medication' },
        ],
        temporal_filter: { type: 'relative', relative: 'last_month' },
        processed_at: new Date().toISOString(),
    };
    // New query (follow-up)
    const newQuery = {
        original_query: 'What about this week?',
        patient_id: 'patient_123',
        intent: follow_up_resolver_service_1.QueryIntent.UNKNOWN,
        entities: [],
        temporal_filter: { type: 'relative', relative: 'this_week' },
        processed_at: new Date().toISOString(),
    };
    console.log('  Previous Query:');
    console.log('    Query:', previousQuery.original_query);
    console.log('    Intent:', previousQuery.intent);
    console.log('    Entities:', previousQuery.entities.map(e => e.value).join(', '));
    console.log('    Temporal:', previousQuery.temporal_filter?.relative);
    console.log('\n  New Query (Follow-up):');
    console.log('    Query:', newQuery.original_query);
    console.log('    Intent:', newQuery.intent);
    console.log('    Entities:', newQuery.entities.length === 0 ? 'none' : newQuery.entities.map(e => e.value).join(', '));
    console.log('    Temporal:', newQuery.temporal_filter?.relative);
    // Merge context
    const merged = follow_up_resolver_service_1.default.mergeContext(newQuery, previousQuery);
    console.log('\n  Merged Query:');
    console.log('    Query:', merged.original_query);
    console.log('    Intent:', merged.intent, '(inherited)');
    console.log('    Entities:', merged.entities.map(e => e.value).join(', '), '(inherited)');
    console.log('    Temporal:', merged.temporal_filter?.relative, '(updated)');
    console.log('\n  ✅ Success (context merged)\n');
}
/**
 * Example 3: Entity inheritance
 */
function exampleEntityInheritance() {
    console.log('Example 3: Entity Inheritance');
    console.log('-'.repeat(80));
    const previousQuery = {
        original_query: 'Show me blood pressure medications',
        patient_id: 'patient_123',
        intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [
            { type: 'medication', value: 'blood pressure medication', normalized: 'blood_pressure_medication' },
        ],
        temporal_filter: null,
        processed_at: new Date().toISOString(),
    };
    console.log('  Scenario: User asks about medications, then asks follow-up questions\n');
    const followUps = [
        { query: 'What about last month?', hasEntities: false, hasTemporal: true },
        { query: 'And this week?', hasEntities: false, hasTemporal: true },
        { query: 'How about aspirin?', hasEntities: true, hasTemporal: false },
    ];
    followUps.forEach((followUp, i) => {
        const newQuery = {
            original_query: followUp.query,
            patient_id: 'patient_123',
            intent: follow_up_resolver_service_1.QueryIntent.UNKNOWN,
            entities: followUp.hasEntities ? [{ type: 'medication', value: 'aspirin', normalized: 'aspirin' }] : [],
            temporal_filter: followUp.hasTemporal ? { type: 'relative', relative: 'last_month' } : null,
            processed_at: new Date().toISOString(),
        };
        const merged = follow_up_resolver_service_1.default.mergeContext(newQuery, previousQuery);
        console.log(`  Follow-up ${i + 1}: "${followUp.query}"`);
        console.log('    Original entities:', newQuery.entities.length > 0 ? newQuery.entities.map(e => e.value).join(', ') : 'none');
        console.log('    Merged entities:', merged.entities.map(e => e.value).join(', '), merged.entities.length === previousQuery.entities.length ? '(inherited)' : '(new)');
        console.log();
    });
    console.log('  ✅ Success (entities inherited correctly)\n');
}
/**
 * Example 4: Temporal filter inheritance
 */
function exampleTemporalInheritance() {
    console.log('Example 4: Temporal Filter Inheritance');
    console.log('-'.repeat(80));
    const previousQuery = {
        original_query: 'What lab tests did I order last month?',
        patient_id: 'patient_123',
        intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_LAB_RESULTS,
        entities: [{ type: 'lab_test', value: 'lab', normalized: 'lab' }],
        temporal_filter: { type: 'relative', relative: 'last_month' },
        processed_at: new Date().toISOString(),
    };
    console.log('  Previous Query:', previousQuery.original_query);
    console.log('    Temporal filter:', previousQuery.temporal_filter?.relative);
    console.log('\n  Follow-up scenarios:\n');
    const scenarios = [
        { query: 'What about cholesterol?', temporal: null, description: 'No temporal → inherit' },
        { query: 'And this week?', temporal: { type: 'relative', relative: 'this_week' }, description: 'New temporal → override' },
        { query: 'Also blood tests?', temporal: null, description: 'No temporal → inherit' },
    ];
    scenarios.forEach((scenario, i) => {
        const newQuery = {
            original_query: scenario.query,
            patient_id: 'patient_123',
            intent: follow_up_resolver_service_1.QueryIntent.UNKNOWN,
            entities: [],
            temporal_filter: scenario.temporal,
            processed_at: new Date().toISOString(),
        };
        const merged = follow_up_resolver_service_1.default.mergeContext(newQuery, previousQuery);
        console.log(`  Scenario ${i + 1}: "${scenario.query}"`);
        console.log('    ', scenario.description);
        console.log('    Result:', merged.temporal_filter?.relative);
        console.log();
    });
    console.log('  ✅ Success (temporal filters handled correctly)\n');
}
/**
 * Example 5: Intent preservation
 */
function exampleIntentPreservation() {
    console.log('Example 5: Intent Preservation');
    console.log('-'.repeat(80));
    const previousQuery = {
        original_query: 'What medications am I taking?',
        patient_id: 'patient_123',
        intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [{ type: 'medication', value: 'medication', normalized: 'medication' }],
        temporal_filter: null,
        processed_at: new Date().toISOString(),
    };
    console.log('  Previous Query:', previousQuery.original_query);
    console.log('    Intent:', previousQuery.intent);
    console.log('\n  Follow-up queries:\n');
    const followUps = [
        { query: 'What about last month?', intent: follow_up_resolver_service_1.QueryIntent.UNKNOWN, description: 'Preserve' },
        { query: 'And blood pressure?', intent: follow_up_resolver_service_1.QueryIntent.UNKNOWN, description: 'Preserve' },
        { query: 'Show me lab results', intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_LAB_RESULTS, description: 'Override' },
    ];
    followUps.forEach((followUp, i) => {
        const newQuery = {
            original_query: followUp.query,
            patient_id: 'patient_123',
            intent: followUp.intent,
            entities: [],
            temporal_filter: null,
            processed_at: new Date().toISOString(),
        };
        const merged = follow_up_resolver_service_1.default.mergeContext(newQuery, previousQuery);
        console.log(`  Query ${i + 1}: "${followUp.query}"`);
        console.log('    Original intent:', newQuery.intent);
        console.log('    Merged intent:', merged.intent);
        console.log('    Action:', followUp.description);
        console.log();
    });
    console.log('  ✅ Success (intent preserved/overridden correctly)\n');
}
/**
 * Example 6: Follow-up resolution with context
 */
function exampleFollowUpResolution() {
    console.log('Example 6: Follow-Up Resolution with Context');
    console.log('-'.repeat(80));
    const context = {
        session_id: 'session_123',
        patient_id: 'patient_456',
        last_query: {
            original_query: 'What medications did I prescribe last month?',
            patient_id: 'patient_456',
            intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
            entities: [
                { type: 'medication', value: 'medication', normalized: 'medication' },
            ],
            temporal_filter: { type: 'relative', relative: 'last_month' },
            processed_at: new Date().toISOString(),
        },
        last_entities: [
            { type: 'medication', value: 'medication', normalized: 'medication' },
        ],
        last_temporal_filter: { type: 'relative', relative: 'last_month' },
        last_intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
    };
    console.log('  Initial Query:', context.last_query?.original_query);
    console.log('    Intent:', context.last_query?.intent);
    console.log('    Entities:', context.last_entities.map(e => e.value).join(', '));
    console.log('    Temporal:', context.last_temporal_filter?.relative);
    console.log('\n  Follow-up: "What about this week?"\n');
    const followUpQuery = 'What about this week?';
    const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(followUpQuery);
    console.log('    Detected as follow-up:', isFollowUp);
    if (isFollowUp) {
        const resolved = follow_up_resolver_service_1.default.resolveFollowUp(followUpQuery, context);
        console.log('\n    Resolved Query:');
        console.log('      Original:', resolved.original_query);
        console.log('      Intent:', resolved.intent, '(inherited)');
        console.log('      Entities:', resolved.entities.map(e => e.value).join(', '), '(inherited)');
        console.log('      Temporal:', resolved.temporal_filter?.relative, '(updated)');
    }
    console.log('\n  ✅ Success (follow-up resolved)\n');
}
/**
 * Example 7: Follow-up chain
 */
function exampleFollowUpChain() {
    console.log('Example 7: Follow-Up Chain');
    console.log('-'.repeat(80));
    console.log('  Conversation chain:\n');
    const queries = [
        {
            query: 'What medications did I prescribe last month?',
            isFollowUp: false,
            description: 'Initial query',
        },
        {
            query: 'What about this week?',
            isFollowUp: true,
            description: 'Follow-up: update temporal filter',
        },
        {
            query: 'And blood pressure medications?',
            isFollowUp: true,
            description: 'Follow-up: add entity filter',
        },
        {
            query: 'How about last year?',
            isFollowUp: true,
            description: 'Follow-up: update temporal again',
        },
    ];
    let currentContext = {
        session_id: 'session_123',
        patient_id: 'patient_789',
        last_entities: [],
        last_temporal_filter: null,
        last_intent: null,
    };
    queries.forEach((item, i) => {
        const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(item.query);
        console.log(`  Query ${i + 1}: "${item.query}"`);
        console.log('    Detected:', isFollowUp ? 'FOLLOW-UP' : 'NEW QUERY');
        console.log('    Description:', item.description);
        if (isFollowUp && currentContext.last_query) {
            const resolved = follow_up_resolver_service_1.default.resolveFollowUp(item.query, currentContext);
            console.log('    Resolved:');
            console.log('      Intent:', resolved.intent);
            console.log('      Entities:', resolved.entities.map(e => e.value).join(', ') || 'none');
            console.log('      Temporal:', resolved.temporal_filter?.relative || 'none');
            // Update context for next iteration
            currentContext.last_query = resolved;
            currentContext.last_entities = resolved.entities;
            currentContext.last_temporal_filter = resolved.temporal_filter;
            currentContext.last_intent = resolved.intent;
        }
        else {
            // First query - simulate parsing
            const parsed = {
                original_query: item.query,
                patient_id: currentContext.patient_id,
                intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
                entities: [{ type: 'medication', value: 'medication', normalized: 'medication' }],
                temporal_filter: { type: 'relative', relative: 'last_month' },
                processed_at: new Date().toISOString(),
            };
            currentContext.last_query = parsed;
            currentContext.last_entities = parsed.entities;
            currentContext.last_temporal_filter = parsed.temporal_filter;
            currentContext.last_intent = parsed.intent;
            console.log('    Parsed:');
            console.log('      Intent:', parsed.intent);
            console.log('      Entities:', parsed.entities.map(e => e.value).join(', '));
            console.log('      Temporal:', parsed.temporal_filter?.relative);
        }
        console.log();
    });
    console.log('  ✅ Success (follow-up chain resolved)\n');
}
/**
 * Example 8: Different follow-up patterns
 */
function exampleFollowUpPatterns() {
    console.log('Example 8: Different Follow-Up Patterns');
    console.log('-'.repeat(80));
    const patterns = follow_up_resolver_service_1.default.getFollowUpPatterns();
    console.log('  Supported follow-up patterns:\n');
    patterns.forEach((pattern, i) => {
        console.log(`    ${i + 1}. ${pattern}`);
    });
    console.log('\n  Testing each pattern:\n');
    const examples = [
        { query: 'And what about aspirin?', pattern: 'Conjunction' },
        { query: 'What about last week?', pattern: 'What about' },
        { query: 'When did I prescribe that?', pattern: 'Question' },
        { query: 'Show me that medication', pattern: 'Pronoun' },
        { query: 'Yes', pattern: 'Confirmation' },
        { query: 'Earlier today', pattern: 'Time reference' },
        { query: 'Compared to last month', pattern: 'Comparison' },
        { query: 'Tell me more', pattern: 'Continuation' },
        { query: 'I mean blood pressure', pattern: 'Clarification' },
        { query: 'Last week', pattern: 'Time modification' },
    ];
    examples.forEach(example => {
        const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(example.query);
        console.log(`    "${example.query}"`);
        console.log(`      Pattern: ${example.pattern}`);
        console.log(`      Detected: ${isFollowUp ? '✓' : '✗'}`);
        console.log();
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Real-world medication conversation
 */
function exampleMedicationConversation() {
    console.log('Example 9: Real-World Medication Conversation');
    console.log('-'.repeat(80));
    console.log('  Scenario: Patient asking about medications\n');
    const conversation = [
        { role: 'Patient', query: 'What medications am I currently taking?' },
        { role: 'System', response: '(Returns list of current medications)' },
        { role: 'Patient', query: 'What about last month?' },
        { role: 'System', response: '(Returns medications from last month with inherited context)' },
        { role: 'Patient', query: 'And blood pressure medications specifically?' },
        { role: 'System', response: '(Filters for blood pressure medications, keeps temporal filter)' },
    ];
    let context = {
        session_id: 'session_medication',
        patient_id: 'patient_123',
        last_entities: [],
        last_temporal_filter: null,
        last_intent: null,
    };
    conversation.forEach((turn, i) => {
        console.log(`  ${i + 1}. ${turn.role}: "${turn.query || turn.response}"`);
        if (turn.role === 'Patient' && turn.query) {
            const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(turn.query);
            if (isFollowUp && context.last_query) {
                const resolved = follow_up_resolver_service_1.default.resolveFollowUp(turn.query, context);
                console.log('     → Follow-up detected');
                console.log('     → Context:', {
                    intent: resolved.intent,
                    entities: resolved.entities.map(e => e.value),
                    temporal: resolved.temporal_filter?.relative,
                });
                context.last_query = resolved;
                context.last_entities = resolved.entities;
                context.last_temporal_filter = resolved.temporal_filter;
                context.last_intent = resolved.intent;
            }
            else {
                // First query
                const parsed = {
                    original_query: turn.query,
                    patient_id: context.patient_id,
                    intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
                    entities: [{ type: 'medication', value: 'medication', normalized: 'medication' }],
                    temporal_filter: null,
                    processed_at: new Date().toISOString(),
                };
                context.last_query = parsed;
                context.last_entities = parsed.entities;
                context.last_temporal_filter = parsed.temporal_filter;
                context.last_intent = parsed.intent;
                console.log('     → New query');
                console.log('     → Context:', {
                    intent: parsed.intent,
                    entities: parsed.entities.map(e => e.value),
                });
            }
        }
        console.log();
    });
    console.log('  ✅ Success (realistic conversation)\n');
}
/**
 * Example 10: Real-world lab results conversation
 */
function exampleLabResultsConversation() {
    console.log('Example 10: Real-World Lab Results Conversation');
    console.log('-'.repeat(80));
    console.log('  Scenario: Doctor reviewing lab results\n');
    const queries = [
        'Show me lab results from last month',
        'What about cholesterol specifically?',
        'And this week?',
        'How do they compare to last year?',
    ];
    let context = {
        session_id: 'session_lab',
        patient_id: 'patient_456',
        last_entities: [],
        last_temporal_filter: null,
        last_intent: null,
    };
    queries.forEach((query, i) => {
        const isFollowUp = follow_up_resolver_service_1.default.isFollowUp(query);
        console.log(`  Query ${i + 1}: "${query}"`);
        console.log('    Type:', isFollowUp ? 'FOLLOW-UP' : 'NEW');
        if (isFollowUp && context.last_query) {
            const resolved = follow_up_resolver_service_1.default.resolveFollowUp(query, context);
            console.log('    Resolved:');
            console.log('      Intent:', resolved.intent);
            console.log('      Entities:', resolved.entities.map(e => e.value).join(', ') || 'none');
            console.log('      Temporal:', resolved.temporal_filter?.relative || 'none');
            context.last_query = resolved;
            context.last_entities = resolved.entities;
            context.last_temporal_filter = resolved.temporal_filter;
            context.last_intent = resolved.intent;
        }
        else {
            // First query
            const parsed = {
                original_query: query,
                patient_id: context.patient_id,
                intent: follow_up_resolver_service_1.QueryIntent.RETRIEVE_LAB_RESULTS,
                entities: [{ type: 'lab_test', value: 'lab', normalized: 'lab' }],
                temporal_filter: { type: 'relative', relative: 'last_month' },
                processed_at: new Date().toISOString(),
            };
            context.last_query = parsed;
            context.last_entities = parsed.entities;
            context.last_temporal_filter = parsed.temporal_filter;
            context.last_intent = parsed.intent;
            console.log('    Parsed:');
            console.log('      Intent:', parsed.intent);
            console.log('      Entities:', parsed.entities.map(e => e.value).join(', '));
            console.log('      Temporal:', parsed.temporal_filter?.relative);
        }
        console.log();
    });
    console.log('  ✅ Success (lab results conversation)\n');
}
/**
 * Example 11: Edge cases
 */
function exampleEdgeCases() {
    console.log('Example 11: Edge Cases');
    console.log('-'.repeat(80));
    console.log('  Testing edge cases:\n');
    // No previous context
    console.log('  Case 1: No previous context');
    const context1 = {
        session_id: 'session_edge',
        patient_id: 'patient_789',
        last_entities: [],
        last_temporal_filter: null,
        last_intent: null,
    };
    const followUp1 = follow_up_resolver_service_1.default.resolveFollowUp('What about last week?', context1);
    console.log('    Follow-up without context:', followUp1.intent);
    console.log('    Result: Creates new query');
    // Very short query
    console.log('\n  Case 2: Very short query');
    const shortQuery = 'Yes';
    const isShortFollowUp = follow_up_resolver_service_1.default.isFollowUp(shortQuery);
    console.log('    Query: "Yes"');
    console.log('    Detected as follow-up:', isShortFollowUp);
    // Long detailed query (not a follow-up)
    console.log('\n  Case 3: Long detailed query');
    const longQuery = 'I would like to see all medications prescribed in the last 6 months';
    const isLongFollowUp = follow_up_resolver_service_1.default.isFollowUp(longQuery);
    console.log('    Query:', longQuery);
    console.log('    Detected as follow-up:', isLongFollowUp);
    console.log('\n  ✅ Success (edge cases handled)\n');
}
/**
 * Example 12: Explain follow-up resolver
 */
function exampleExplain() {
    console.log('Example 12: Explain Follow-Up Resolver');
    console.log('-'.repeat(80));
    const explanation = follow_up_resolver_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('FOLLOW-UP RESOLVER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicDetection();
        exampleContextMerging();
        exampleEntityInheritance();
        exampleTemporalInheritance();
        exampleIntentPreservation();
        exampleFollowUpResolution();
        exampleFollowUpChain();
        exampleFollowUpPatterns();
        exampleMedicationConversation();
        exampleLabResultsConversation();
        exampleEdgeCases();
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
//# sourceMappingURL=follow-up-resolver.example.js.map