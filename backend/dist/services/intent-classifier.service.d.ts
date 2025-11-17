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
/**
 * Query intent types
 */
export declare enum QueryIntent {
    RETRIEVE_MEDICATIONS = "retrieve_medications",
    RETRIEVE_CARE_PLANS = "retrieve_care_plans",
    RETRIEVE_NOTES = "retrieve_notes",
    RETRIEVE_ALL = "retrieve_all",
    SUMMARY = "summary",
    COMPARISON = "comparison",
    UNKNOWN = "unknown"
}
/**
 * Intent classification result
 */
export interface IntentClassification {
    intent: QueryIntent;
    confidence: number;
    matchedKeywords: string[];
    ambiguousIntents?: Array<{
        intent: QueryIntent;
        confidence: number;
    }>;
}
/**
 * Intent Classifier Class
 *
 * Rule-based classification using keyword matching and pattern detection
 */
declare class IntentClassifier {
    /**
     * Keyword patterns for each intent type
     * Each keyword has an associated weight for confidence scoring
     */
    private readonly intentPatterns;
    /**
     * Regex patterns for special intent detection
     */
    private readonly specialPatterns;
    /**
     * Minimum confidence threshold for classification
     */
    private readonly MIN_CONFIDENCE_THRESHOLD;
    /**
     * Threshold for considering multiple intents as ambiguous
     */
    private readonly AMBIGUITY_THRESHOLD;
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
    classifyIntent(query: string): IntentClassification;
    /**
     * Check special regex patterns
     *
     * @param normalizedQuery - Normalized query string
     * @returns Matched pattern or null
     */
    private checkSpecialPatterns;
    /**
     * Calculate keyword-based scores for all intents
     *
     * @param normalizedQuery - Normalized query string
     * @returns Scores for each intent (0.0 to 1.0)
     */
    private calculateKeywordScores;
    /**
     * Check if query contains a keyword (supports multi-word keywords)
     *
     * @param query - Normalized query
     * @param keyword - Keyword to search for
     * @returns True if keyword is found
     */
    private containsKeyword;
    /**
     * Escape special regex characters
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    private escapeRegex;
    /**
     * Get list of matched keywords for a specific intent
     *
     * @param normalizedQuery - Normalized query string
     * @param intent - Intent to check
     * @returns List of matched keywords
     */
    private getMatchedKeywords;
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
    getIntentKeywords(): Record<QueryIntent, string[]>;
    /**
     * Classify multiple queries in batch
     *
     * @param queries - Array of queries to classify
     * @returns Array of intent classifications
     */
    classifyBatch(queries: string[]): IntentClassification[];
    /**
     * Get confidence threshold
     *
     * @returns Minimum confidence threshold
     */
    getConfidenceThreshold(): number;
    /**
     * Get ambiguity threshold
     *
     * @returns Ambiguity detection threshold
     */
    getAmbiguityThreshold(): number;
}
declare const intentClassifier: IntentClassifier;
export default intentClassifier;
//# sourceMappingURL=intent-classifier.service.d.ts.map