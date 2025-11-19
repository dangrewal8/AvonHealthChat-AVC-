/**
 * Enhanced Query Understanding System with Advanced NLP
 * Handles synonyms, abbreviations, variations, and complex questions
 */
/**
 * Enhanced intent detection with scoring
 */
export declare function detectIntent(query: string): {
    primary: string;
    confidence: number;
    normalized: string;
    questionType: string;
    hasTimeContext: boolean;
    isTrend: boolean;
    isNegated: boolean;
};
/**
 * Handle multi-part questions by detecting "and"
 */
export declare function isMultiPartQuestion(query: string): boolean;
/**
 * Split multi-part questions
 */
export declare function splitMultiPartQuestion(query: string): string[];
/**
 * Extract specific entities from the query (medication names, dates, numbers)
 */
export declare function extractEntities(query: string): {
    medications: string[];
    dates: string[];
    numbers: number[];
    conditions: string[];
};
/**
 * Determine question complexity
 */
export declare function getQueryComplexity(query: string): {
    level: 'simple' | 'moderate' | 'complex';
    score: number;
    reasons: string[];
};
/**
 * Detect if this is a follow-up question
 */
export declare function isFollowUpQuestion(query: string): boolean;
/**
 * Enhanced intent detection with more context
 */
export declare function analyzeQuery(query: string): {
    intent: ReturnType<typeof detectIntent>;
    entities: ReturnType<typeof extractEntities>;
    complexity: ReturnType<typeof getQueryComplexity>;
    isFollowUp: boolean;
    isMultiPart: boolean;
    suggestions: string[];
};
//# sourceMappingURL=enhanced-query-understanding.d.ts.map