"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIntent = void 0;
/**
 * Query intent
 */
var QueryIntent;
(function (QueryIntent) {
    QueryIntent["RETRIEVE_MEDICATIONS"] = "retrieve_medications";
    QueryIntent["RETRIEVE_DIAGNOSES"] = "retrieve_diagnoses";
    QueryIntent["RETRIEVE_LAB_RESULTS"] = "retrieve_lab_results";
    QueryIntent["RETRIEVE_VITALS"] = "retrieve_vitals";
    QueryIntent["RETRIEVE_PROCEDURES"] = "retrieve_procedures";
    QueryIntent["RETRIEVE_ALLERGIES"] = "retrieve_allergies";
    QueryIntent["RETRIEVE_IMMUNIZATIONS"] = "retrieve_immunizations";
    QueryIntent["RETRIEVE_ENCOUNTERS"] = "retrieve_encounters";
    QueryIntent["GENERAL_QUERY"] = "general_query";
    QueryIntent["UNKNOWN"] = "unknown";
})(QueryIntent || (exports.QueryIntent = QueryIntent = {}));
/**
 * Follow-Up Resolver Class
 *
 * Detect and resolve follow-up queries using conversation context
 */
class FollowUpResolver {
    /**
     * Follow-up detection patterns
     */
    FOLLOW_UP_PATTERNS = [
        // Starting with conjunctions
        /^(and|also|additionally|furthermore|moreover|besides)/i,
        // Starting with "what about" / "how about"
        /^(what about|how about)/i,
        // Questions about previous context
        /^(when|where|who|why|how) (did|was|were|is|are)/i,
        // Pronouns referring to previous context
        /\b(that|this|it|those|these|they|them)\b/i,
        // Short queries (likely follow-ups)
        /^(yes|no|okay|sure|right)\b/i,
        // Time-based follow-ups
        /^(earlier|later|before|after|previously)\b/i,
        // Comparisons
        /^(compared to|versus|vs|instead of)/i,
        // Continuation
        /^(continue|go on|tell me more|what else)/i,
        // Clarifications
        /^(I mean|actually|specifically|exactly)/i,
        // Just time/quantity modifications
        /^(last|this|next|past) (week|month|year|day)/i,
    ];
    /**
     * Check if query is a follow-up
     *
     * Uses pattern matching to detect follow-up indicators
     *
     * @param query - User query
     * @returns True if query is likely a follow-up
     */
    isFollowUp(query) {
        const trimmedQuery = query.trim();
        // Very short queries are likely follow-ups
        if (trimmedQuery.length < 15 && trimmedQuery.split(' ').length <= 3) {
            return true;
        }
        // Check against patterns
        return this.FOLLOW_UP_PATTERNS.some(pattern => pattern.test(trimmedQuery));
    }
    /**
     * Resolve follow-up query using conversation context
     *
     * Takes a follow-up query and enriches it with context from previous query
     *
     * @param query - Current query
     * @param context - Conversation context
     * @returns Resolved structured query with inherited context
     */
    resolveFollowUp(query, context) {
        // If no previous query, treat as new query
        if (!context.last_query) {
            return this.createNewQuery(query, context.patient_id);
        }
        // Parse current query (basic parsing)
        const currentQuery = this.parseQuery(query, context.patient_id);
        // Merge with previous context
        return this.mergeContext(currentQuery, context.last_query);
    }
    /**
     * Merge context from previous query
     *
     * Intelligently combines new query with previous query context
     *
     * @param newQuery - Current structured query
     * @param previousQuery - Previous structured query
     * @returns Merged structured query
     */
    mergeContext(newQuery, previousQuery) {
        return {
            ...newQuery,
            // Inherit entities if new query has none
            entities: newQuery.entities.length > 0
                ? newQuery.entities
                : previousQuery.entities,
            // Inherit temporal filter if new query has none
            temporal_filter: newQuery.temporal_filter || previousQuery.temporal_filter,
            // Keep original intent unless specifically changed
            intent: newQuery.intent !== QueryIntent.UNKNOWN
                ? newQuery.intent
                : previousQuery.intent,
        };
    }
    /**
     * Parse query into structured query (basic parsing)
     *
     * @param query - User query
     * @param patientId - Patient ID
     * @returns Structured query
     */
    parseQuery(query, patientId) {
        const entities = this.extractEntities(query);
        const temporalFilter = this.extractTemporalFilter(query);
        const intent = this.detectIntent(query, entities);
        return {
            original_query: query,
            patient_id: patientId,
            intent,
            entities,
            temporal_filter: temporalFilter,
            processed_at: new Date().toISOString(),
        };
    }
    /**
     * Create new query (no context)
     *
     * @param query - User query
     * @param patientId - Patient ID
     * @returns Structured query
     */
    createNewQuery(query, patientId) {
        return this.parseQuery(query, patientId);
    }
    /**
     * Extract entities from query (basic extraction)
     *
     * @param query - User query
     * @returns Array of entities
     */
    extractEntities(query) {
        const entities = [];
        const lowerQuery = query.toLowerCase();
        // Medication entities
        const medicationPatterns = [
            'medication', 'medicine', 'drug', 'prescription', 'pill',
            'aspirin', 'ibuprofen', 'acetaminophen', 'antibiotic',
        ];
        medicationPatterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                entities.push({
                    type: 'medication',
                    value: pattern,
                    normalized: pattern,
                });
            }
        });
        // Diagnosis entities
        const diagnosisPatterns = [
            'diagnosis', 'condition', 'disease', 'illness',
            'diabetes', 'hypertension', 'asthma', 'covid',
        ];
        diagnosisPatterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                entities.push({
                    type: 'diagnosis',
                    value: pattern,
                    normalized: pattern,
                });
            }
        });
        // Lab test entities
        const labPatterns = [
            'lab', 'test', 'blood test', 'screening',
            'cholesterol', 'glucose', 'hemoglobin', 'a1c',
        ];
        labPatterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                entities.push({
                    type: 'lab_test',
                    value: pattern,
                    normalized: pattern,
                });
            }
        });
        // Vital entities
        const vitalPatterns = [
            'vital', 'blood pressure', 'temperature', 'heart rate',
            'weight', 'height', 'bmi', 'oxygen',
        ];
        vitalPatterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                entities.push({
                    type: 'vital',
                    value: pattern,
                    normalized: pattern,
                });
            }
        });
        // Procedure entities
        const procedurePatterns = [
            'procedure', 'surgery', 'operation', 'treatment',
            'x-ray', 'mri', 'ct scan', 'ultrasound',
        ];
        procedurePatterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                entities.push({
                    type: 'procedure',
                    value: pattern,
                    normalized: pattern,
                });
            }
        });
        return entities;
    }
    /**
     * Extract temporal filter from query
     *
     * @param query - User query
     * @returns Temporal filter or null
     */
    extractTemporalFilter(query) {
        const lowerQuery = query.toLowerCase();
        // Relative filters
        if (lowerQuery.includes('today')) {
            return { type: 'relative', relative: 'today' };
        }
        if (lowerQuery.includes('this week')) {
            return { type: 'relative', relative: 'this_week' };
        }
        if (lowerQuery.includes('this month')) {
            return { type: 'relative', relative: 'this_month' };
        }
        if (lowerQuery.includes('last week')) {
            return { type: 'relative', relative: 'last_week' };
        }
        if (lowerQuery.includes('last month')) {
            return { type: 'relative', relative: 'last_month' };
        }
        if (lowerQuery.includes('last year')) {
            return { type: 'relative', relative: 'last_year' };
        }
        return null;
    }
    /**
     * Detect intent from query
     *
     * @param query - User query
     * @param entities - Extracted entities
     * @returns Query intent
     */
    detectIntent(query, entities) {
        const lowerQuery = query.toLowerCase();
        // Check for medication intent
        if (lowerQuery.includes('medication') ||
            lowerQuery.includes('medicine') ||
            lowerQuery.includes('prescription') ||
            entities.some(e => e.type === 'medication')) {
            return QueryIntent.RETRIEVE_MEDICATIONS;
        }
        // Check for diagnosis intent
        if (lowerQuery.includes('diagnosis') ||
            lowerQuery.includes('condition') ||
            entities.some(e => e.type === 'diagnosis')) {
            return QueryIntent.RETRIEVE_DIAGNOSES;
        }
        // Check for lab results intent
        if (lowerQuery.includes('lab') ||
            lowerQuery.includes('test') ||
            entities.some(e => e.type === 'lab_test')) {
            return QueryIntent.RETRIEVE_LAB_RESULTS;
        }
        // Check for vitals intent
        if (lowerQuery.includes('vital') ||
            lowerQuery.includes('blood pressure') ||
            lowerQuery.includes('temperature') ||
            entities.some(e => e.type === 'vital')) {
            return QueryIntent.RETRIEVE_VITALS;
        }
        // Check for procedures intent
        if (lowerQuery.includes('procedure') ||
            lowerQuery.includes('surgery') ||
            entities.some(e => e.type === 'procedure')) {
            return QueryIntent.RETRIEVE_PROCEDURES;
        }
        // Check for allergies intent
        if (lowerQuery.includes('allerg')) {
            return QueryIntent.RETRIEVE_ALLERGIES;
        }
        // Check for immunizations intent
        if (lowerQuery.includes('immunization') ||
            lowerQuery.includes('vaccination') ||
            lowerQuery.includes('vaccine')) {
            return QueryIntent.RETRIEVE_IMMUNIZATIONS;
        }
        // Check for encounters intent
        if (lowerQuery.includes('visit') ||
            lowerQuery.includes('appointment') ||
            lowerQuery.includes('encounter')) {
            return QueryIntent.RETRIEVE_ENCOUNTERS;
        }
        // Default to general query
        if (entities.length > 0) {
            return QueryIntent.GENERAL_QUERY;
        }
        return QueryIntent.UNKNOWN;
    }
    /**
     * Get follow-up patterns
     *
     * @returns Array of follow-up pattern descriptions
     */
    getFollowUpPatterns() {
        return [
            'Conjunctions: and, also, additionally, furthermore',
            'What about / How about questions',
            'Questions: when, where, who, why, how',
            'Pronouns: that, this, it, those, these',
            'Confirmations: yes, no, okay, sure',
            'Time references: earlier, later, before, after',
            'Comparisons: compared to, versus, instead of',
            'Continuations: continue, tell me more',
            'Clarifications: I mean, actually, specifically',
            'Time modifications: last week, this month, next year',
        ];
    }
    /**
     * Explain follow-up resolver
     *
     * @returns Explanation string
     */
    explain() {
        return `Follow-Up Resolver:

Detection:
- Pattern matching for follow-up indicators
- Conjunction words (and, also, additionally)
- Pronoun references (that, this, it)
- Short queries (< 15 chars or ≤ 3 words)
- Time modifications (last week, this month)

Context Merging:
1. Inherit entities if new query has none
2. Inherit temporal filter if new query has none
3. Preserve intent unless specifically changed

Example Follow-Up Chain:
Query 1: "What medications did I prescribe last month?"
  → Intent: retrieve_medications
  → Entities: [medication, prescribe]
  → Temporal: last_month

Query 2: "What about this week?"
  → Detected as follow-up
  → Inherit entities: [medication, prescribe]
  → Update temporal: this_week
  → Keep intent: retrieve_medications

Query 3: "And blood pressure medications?"
  → Detected as follow-up
  → Add entity: blood_pressure
  → Keep temporal: this_week
  → Keep intent: retrieve_medications

Tech Stack: Node.js + TypeScript (pattern matching)
NO external NLP libraries`;
    }
}
// Export singleton instance
const followUpResolver = new FollowUpResolver();
exports.default = followUpResolver;
//# sourceMappingURL=follow-up-resolver.service.js.map