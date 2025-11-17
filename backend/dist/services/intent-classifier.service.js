"use strict";
/**
 * Query Intent Classification Service
 *
 * Rule-based classifier for medical queries using keyword and pattern matching
 *
 * Features:
 * - Intent classification (medications, care plans, notes, summaries, comparisons)
 * - Confidence scoring
 * - Ambiguity handling
 * - Pattern matching for complex intents
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIntent = void 0;
/**
 * Query intent types
 */
var QueryIntent;
(function (QueryIntent) {
    QueryIntent["RETRIEVE_MEDICATIONS"] = "retrieve_medications";
    QueryIntent["RETRIEVE_CARE_PLANS"] = "retrieve_care_plans";
    QueryIntent["RETRIEVE_NOTES"] = "retrieve_notes";
    QueryIntent["RETRIEVE_ALL"] = "retrieve_all";
    QueryIntent["SUMMARY"] = "summary";
    QueryIntent["COMPARISON"] = "comparison";
    QueryIntent["UNKNOWN"] = "unknown";
})(QueryIntent || (exports.QueryIntent = QueryIntent = {}));
/**
 * Intent Classifier Class
 *
 * Rule-based classification using keyword matching and pattern detection
 */
class IntentClassifier {
    /**
     * Keyword patterns for each intent type
     * Each keyword has an associated weight for confidence scoring
     */
    intentPatterns = {
        [QueryIntent.RETRIEVE_MEDICATIONS]: [
            {
                keywords: [
                    'medication',
                    'medications',
                    'medicine',
                    'drug',
                    'drugs',
                    'prescription',
                    'prescriptions',
                    'prescribe',
                    'prescribed',
                ],
                weight: 1.0,
            },
            {
                keywords: [
                    'metformin',
                    'insulin',
                    'aspirin',
                    'lisinopril',
                    'atorvastatin',
                    'levothyroxine',
                    'omeprazole',
                    'dosage',
                    'dose',
                    'mg',
                    'pill',
                    'pills',
                    'tablet',
                    'tablets',
                ],
                weight: 0.8,
            },
            {
                keywords: ['rx', 'refill', 'pharmacy', 'taking', 'on'],
                weight: 0.5,
            },
        ],
        [QueryIntent.RETRIEVE_CARE_PLANS]: [
            {
                keywords: [
                    'care plan',
                    'care plans',
                    'treatment plan',
                    'treatment plans',
                    'plan of care',
                    'care coordination',
                    'care management',
                ],
                weight: 1.0,
            },
            {
                keywords: [
                    'treatment',
                    'therapy',
                    'intervention',
                    'goal',
                    'goals',
                    'objective',
                    'objectives',
                    'recommendation',
                    'recommendations',
                ],
                weight: 0.7,
            },
            {
                keywords: ['plan', 'planning', 'strategy', 'approach', 'protocol'],
                weight: 0.5,
            },
        ],
        [QueryIntent.RETRIEVE_NOTES]: [
            {
                keywords: [
                    'note',
                    'notes',
                    'progress note',
                    'progress notes',
                    'clinical note',
                    'clinical notes',
                    'documentation',
                    'encounter',
                    'encounters',
                ],
                weight: 1.0,
            },
            {
                keywords: [
                    'visit',
                    'visits',
                    'appointment',
                    'appointments',
                    'consultation',
                    'consultations',
                    'assessment',
                    'assessments',
                    'chart',
                    'charting',
                ],
                weight: 0.7,
            },
            {
                keywords: ['documented', 'recorded', 'reported', 'written', 'noted'],
                weight: 0.5,
            },
        ],
        [QueryIntent.SUMMARY]: [
            {
                keywords: [
                    'summarize',
                    'summary',
                    'summaries',
                    'overview',
                    'brief',
                    'highlights',
                    'key points',
                ],
                weight: 1.0,
            },
            {
                keywords: [
                    'what is',
                    "what's",
                    'tell me about',
                    'give me',
                    'show me',
                    'describe',
                    'explain',
                ],
                weight: 0.6,
            },
            {
                keywords: ['all', 'everything', 'complete', 'comprehensive', 'full', 'entire'],
                weight: 0.4,
            },
        ],
        [QueryIntent.COMPARISON]: [
            {
                keywords: [
                    'compare',
                    'comparison',
                    'versus',
                    'vs',
                    'difference',
                    'differences',
                    'changed',
                    'changes',
                    'change',
                ],
                weight: 1.0,
            },
            {
                keywords: [
                    'before and after',
                    'then and now',
                    'previous',
                    'current',
                    'old',
                    'new',
                    'latest',
                    'earlier',
                ],
                weight: 0.7,
            },
            {
                keywords: ['between', 'from', 'to', 'trend', 'trends', 'progression', 'evolution'],
                weight: 0.5,
            },
        ],
        [QueryIntent.RETRIEVE_ALL]: [
            {
                keywords: ['all', 'everything', 'any', 'anything', 'complete', 'entire', 'full'],
                weight: 0.6,
            },
            {
                keywords: ['records', 'data', 'information', 'history', 'medical history'],
                weight: 0.4,
            },
        ],
        [QueryIntent.UNKNOWN]: [],
    };
    /**
     * Regex patterns for special intent detection
     */
    specialPatterns = [
        {
            // Comparison patterns
            pattern: /what (changed|differences?|variations?)|how (did|has).*(changed?|differ|vary)|compare.*(?:with|to|between)/i,
            intent: QueryIntent.COMPARISON,
            confidence: 0.9,
        },
        {
            // Summary patterns
            pattern: /(give|show|tell).*(summary|overview|brief)|summarize|what (is|are)/i,
            intent: QueryIntent.SUMMARY,
            confidence: 0.8,
        },
        {
            // Medication patterns
            pattern: /what (medications?|drugs?|prescriptions?)|list.*medications?|medications?.*taking/i,
            intent: QueryIntent.RETRIEVE_MEDICATIONS,
            confidence: 0.85,
        },
        {
            // Care plan patterns
            pattern: /what.*(treatment plan|care plan)|show.*(plan of care)/i,
            intent: QueryIntent.RETRIEVE_CARE_PLANS,
            confidence: 0.85,
        },
        {
            // Notes patterns
            pattern: /show.*(notes?|visits?|encounters?)|recent (notes?|visits?)/i,
            intent: QueryIntent.RETRIEVE_NOTES,
            confidence: 0.8,
        },
    ];
    /**
     * Minimum confidence threshold for classification
     */
    MIN_CONFIDENCE_THRESHOLD = 0.3;
    /**
     * Threshold for considering multiple intents as ambiguous
     */
    AMBIGUITY_THRESHOLD = 0.15;
    /**
     * Classify query intent
     *
     * @param query - Natural language query
     * @returns Intent classification with confidence score
     *
     * @example
     * classifyIntent("What medications is the patient taking?")
     * // Returns: {
     * //   intent: QueryIntent.RETRIEVE_MEDICATIONS,
     * //   confidence: 0.95,
     * //   matchedKeywords: ["medications", "taking"]
     * // }
     */
    classifyIntent(query) {
        if (!query || query.trim().length === 0) {
            return {
                intent: QueryIntent.UNKNOWN,
                confidence: 1.0,
                matchedKeywords: [],
            };
        }
        const normalizedQuery = query.toLowerCase().trim();
        // Step 1: Check special patterns first (highest priority)
        const specialMatch = this.checkSpecialPatterns(normalizedQuery);
        if (specialMatch) {
            // Get matched keywords for the detected intent
            const matchedKeywords = this.getMatchedKeywords(normalizedQuery, specialMatch.intent);
            return {
                intent: specialMatch.intent,
                confidence: specialMatch.confidence,
                matchedKeywords,
            };
        }
        // Step 2: Calculate scores for each intent based on keyword matching
        const intentScores = this.calculateKeywordScores(normalizedQuery);
        // Step 3: Find the best matching intent
        const sortedIntents = Object.entries(intentScores)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .map(([intent, score]) => ({
            intent: intent,
            confidence: score,
        }));
        const topIntent = sortedIntents[0];
        // Step 4: Check if intent meets minimum confidence threshold
        if (topIntent.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
            // Default to RETRIEVE_ALL for low confidence
            return {
                intent: QueryIntent.RETRIEVE_ALL,
                confidence: 0.5,
                matchedKeywords: [],
            };
        }
        // Step 5: Check for ambiguity (multiple intents with similar scores)
        const ambiguousIntents = sortedIntents.slice(1).filter((intentScore) => {
            return (topIntent.confidence - intentScore.confidence <= this.AMBIGUITY_THRESHOLD &&
                intentScore.confidence >= this.MIN_CONFIDENCE_THRESHOLD);
        });
        // Step 6: Get matched keywords
        const matchedKeywords = this.getMatchedKeywords(normalizedQuery, topIntent.intent);
        return {
            intent: topIntent.intent,
            confidence: topIntent.confidence,
            matchedKeywords,
            ambiguousIntents: ambiguousIntents.length > 0 ? ambiguousIntents : undefined,
        };
    }
    /**
     * Check special regex patterns
     *
     * @param normalizedQuery - Normalized query string
     * @returns Matched pattern or null
     */
    checkSpecialPatterns(normalizedQuery) {
        for (const { pattern, intent, confidence } of this.specialPatterns) {
            if (pattern.test(normalizedQuery)) {
                return { intent, confidence };
            }
        }
        return null;
    }
    /**
     * Calculate keyword-based scores for all intents
     *
     * @param normalizedQuery - Normalized query string
     * @returns Scores for each intent (0.0 to 1.0)
     */
    calculateKeywordScores(normalizedQuery) {
        const scores = {
            [QueryIntent.RETRIEVE_MEDICATIONS]: 0,
            [QueryIntent.RETRIEVE_CARE_PLANS]: 0,
            [QueryIntent.RETRIEVE_NOTES]: 0,
            [QueryIntent.RETRIEVE_ALL]: 0,
            [QueryIntent.SUMMARY]: 0,
            [QueryIntent.COMPARISON]: 0,
            [QueryIntent.UNKNOWN]: 0,
        };
        for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
            let totalScore = 0;
            let maxPossibleScore = 0;
            for (const { keywords, weight } of patterns) {
                maxPossibleScore += weight;
                for (const keyword of keywords) {
                    // Check if keyword is present in query
                    if (this.containsKeyword(normalizedQuery, keyword)) {
                        totalScore += weight;
                        break; // Only count each pattern once
                    }
                }
            }
            // Normalize score to 0.0 - 1.0 range
            if (maxPossibleScore > 0) {
                scores[intent] = Math.min(totalScore / maxPossibleScore, 1.0);
            }
        }
        return scores;
    }
    /**
     * Check if query contains a keyword (supports multi-word keywords)
     *
     * @param query - Normalized query
     * @param keyword - Keyword to search for
     * @returns True if keyword is found
     */
    containsKeyword(query, keyword) {
        // Use word boundaries for single words
        if (!keyword.includes(' ')) {
            const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
            return regex.test(query);
        }
        // For multi-word keywords, use simple includes
        return query.includes(keyword.toLowerCase());
    }
    /**
     * Escape special regex characters
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get list of matched keywords for a specific intent
     *
     * @param normalizedQuery - Normalized query string
     * @param intent - Intent to check
     * @returns List of matched keywords
     */
    getMatchedKeywords(normalizedQuery, intent) {
        const matched = [];
        const patterns = this.intentPatterns[intent];
        if (!patterns) {
            return matched;
        }
        for (const { keywords } of patterns) {
            for (const keyword of keywords) {
                if (this.containsKeyword(normalizedQuery, keyword)) {
                    matched.push(keyword);
                }
            }
        }
        return matched;
    }
    /**
     * Get keyword mappings for all intents
     *
     * @returns Keyword mappings for each intent
     *
     * @example
     * getIntentKeywords()
     * // Returns: {
     * //   retrieve_medications: ["medication", "drug", "prescription", ...],
     * //   retrieve_care_plans: ["care plan", "treatment plan", ...],
     * //   ...
     * // }
     */
    getIntentKeywords() {
        const keywords = {
            [QueryIntent.RETRIEVE_MEDICATIONS]: [],
            [QueryIntent.RETRIEVE_CARE_PLANS]: [],
            [QueryIntent.RETRIEVE_NOTES]: [],
            [QueryIntent.RETRIEVE_ALL]: [],
            [QueryIntent.SUMMARY]: [],
            [QueryIntent.COMPARISON]: [],
            [QueryIntent.UNKNOWN]: [],
        };
        for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
            const allKeywords = [];
            for (const { keywords: patternKeywords } of patterns) {
                allKeywords.push(...patternKeywords);
            }
            keywords[intent] = allKeywords;
        }
        return keywords;
    }
    /**
     * Classify multiple queries in batch
     *
     * @param queries - Array of queries to classify
     * @returns Array of intent classifications
     */
    classifyBatch(queries) {
        return queries.map((query) => this.classifyIntent(query));
    }
    /**
     * Get confidence threshold
     *
     * @returns Minimum confidence threshold
     */
    getConfidenceThreshold() {
        return this.MIN_CONFIDENCE_THRESHOLD;
    }
    /**
     * Get ambiguity threshold
     *
     * @returns Ambiguity detection threshold
     */
    getAmbiguityThreshold() {
        return this.AMBIGUITY_THRESHOLD;
    }
}
// Export singleton instance
const intentClassifier = new IntentClassifier();
exports.default = intentClassifier;
//# sourceMappingURL=intent-classifier.service.js.map