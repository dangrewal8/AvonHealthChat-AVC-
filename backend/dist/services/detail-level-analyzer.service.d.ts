/**
 * Detail Level Analyzer Service
 *
 * Assigns detail level to queries based on complexity (1-5 scale)
 * Provides response guidelines for each detail level
 *
 * Features:
 * - Rule-based query complexity analysis
 * - Detail level assignment (MINIMAL to COMPREHENSIVE)
 * - Response formatting guidelines per level
 * - Integration with Query Understanding Agent
 *
 */
import { QueryIntent } from './intent-classifier.service';
import { Entity } from './entity-extractor.service';
/**
 * Detail level scale (1-5)
 */
export declare enum DetailLevel {
    MINIMAL = 1,// Yes/no, quick fact
    BASIC = 2,// Simple query, one fact
    STANDARD = 3,// Normal retrieval, multiple facts
    DETAILED = 4,// Analysis, comparison
    COMPREHENSIVE = 5
}
/**
 * Response formatting guidelines for each detail level
 */
export interface ResponseGuidelines {
    level: DetailLevel;
    short_answer_max_words: number;
    detailed_summary_bullets: number;
    min_sources: number;
    include_reasoning: boolean;
}
/**
 * Detail level analysis result
 */
export interface DetailLevelAnalysis {
    level: DetailLevel;
    confidence: number;
    reasoning: string[];
    guidelines: ResponseGuidelines;
}
/**
 * Detail Level Analyzer Class
 *
 * Analyzes query complexity and assigns appropriate detail level
 * Uses rule-based pattern matching (no ML)
 */
declare class DetailLevelAnalyzer {
    /**
     * Analyze query and assign detail level
     *
     * @param query - Natural language query
     * @param intent - Classified query intent
     * @param entities - Extracted entities (optional)
     * @returns Detail level (1-5)
     *
     * @example
     * analyzeQuery("Is patient on aspirin?", QueryIntent.RETRIEVE_MEDICATIONS)
     * // Returns: DetailLevel.MINIMAL (1)
     *
     * analyzeQuery("Compare blood pressure trends over last 3 months", QueryIntent.COMPARISON)
     * // Returns: DetailLevel.COMPREHENSIVE (5)
     */
    analyzeQuery(query: string, intent: QueryIntent, entities?: Entity[]): DetailLevel;
    /**
     * Analyze query with detailed reasoning
     *
     * @param query - Natural language query
     * @param intent - Classified query intent
     * @param entities - Extracted entities (optional)
     * @returns Detailed analysis with reasoning
     */
    analyzeWithReasoning(query: string, intent: QueryIntent, entities?: Entity[]): DetailLevelAnalysis;
    /**
     * Get response guidelines for a detail level
     *
     * @param level - Detail level
     * @returns Response formatting guidelines
     */
    getResponseGuidelines(level: DetailLevel): ResponseGuidelines;
    /**
     * Get all response guidelines
     *
     * @returns All response guidelines by level
     */
    getAllGuidelines(): Record<DetailLevel, ResponseGuidelines>;
    /**
     * Get detail level description
     *
     * @param level - Detail level
     * @returns Human-readable description
     */
    getDescription(level: DetailLevel): string;
    /**
     * Check if query is a yes/no question
     *
     * Patterns:
     * - "Is patient on aspirin?"
     * - "Did patient have surgery?"
     * - "Has patient been diagnosed with diabetes?"
     *
     * @param query - Lowercase query
     * @returns True if yes/no question
     */
    private isYesNoQuestion;
    /**
     * Check if query is a simple fact lookup
     *
     * Patterns:
     * - "What medications is patient taking?"
     * - "When was last visit?"
     * - "Who is the primary care physician?"
     *
     * @param query - Lowercase query
     * @returns True if simple fact lookup
     */
    private isSimpleFactLookup;
    /**
     * Check if query requires complex analysis
     *
     * Patterns:
     * - "Analyze blood pressure trends"
     * - "Compare medication effectiveness"
     * - "Explain why patient was hospitalized"
     * - "How does treatment affect outcomes?"
     *
     * @param query - Lowercase query
     * @returns True if complex analysis
     */
    private isComplexAnalysis;
    /**
     * Check if query has multiple complex elements
     *
     * Indicators:
     * - Multiple entities (3+)
     * - Multiple time periods
     * - Compound conditions ("and", "or")
     *
     * @param query - Lowercase query
     * @param entities - Extracted entities
     * @returns True if multiple complex elements
     */
    private hasMultipleComplexElements;
    /**
     * Count time references in query
     *
     * @param query - Lowercase query
     * @returns Number of time references
     */
    private countTimeReferences;
    /**
     * Get complex analysis keywords found in query
     *
     * @param query - Lowercase query
     * @returns Array of keywords found
     */
    private getComplexAnalysisKeywords;
    /**
     * Get detail level based on intent
     *
     * @param intent - Query intent
     * @returns Suggested detail level
     */
    private getDetailLevelFromIntent;
    /**
     * Batch analyze multiple queries
     *
     * @param queries - Array of queries with intent and entities
     * @returns Array of detail levels
     */
    analyzeBatch(queries: Array<{
        query: string;
        intent: QueryIntent;
        entities?: Entity[];
    }>): DetailLevel[];
    /**
     * Batch analyze with reasoning
     *
     * @param queries - Array of queries with intent and entities
     * @returns Array of detail level analyses
     */
    analyzeBatchWithReasoning(queries: Array<{
        query: string;
        intent: QueryIntent;
        entities?: Entity[];
    }>): DetailLevelAnalysis[];
    /**
     * Get level name
     *
     * @param level - Detail level number
     * @returns Level name
     */
    getLevelName(level: DetailLevel): string;
    /**
     * Check if query requires reasoning in response
     *
     * @param level - Detail level
     * @returns True if reasoning should be included
     */
    requiresReasoning(level: DetailLevel): boolean;
    /**
     * Get minimum number of sources needed
     *
     * @param level - Detail level
     * @returns Minimum sources
     */
    getMinSources(level: DetailLevel): number;
    /**
     * Get maximum words for short answer
     *
     * @param level - Detail level
     * @returns Max words
     */
    getMaxAnswerWords(level: DetailLevel): number;
    /**
     * Get number of summary bullets
     *
     * @param level - Detail level
     * @returns Number of bullets
     */
    getSummaryBullets(level: DetailLevel): number;
}
declare const detailLevelAnalyzer: DetailLevelAnalyzer;
export default detailLevelAnalyzer;
//# sourceMappingURL=detail-level-analyzer.service.d.ts.map