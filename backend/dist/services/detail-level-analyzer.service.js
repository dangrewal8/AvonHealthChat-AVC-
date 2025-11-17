"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailLevel = void 0;
const intent_classifier_service_1 = require("./intent-classifier.service");
/**
 * Detail level scale (1-5)
 */
var DetailLevel;
(function (DetailLevel) {
    DetailLevel[DetailLevel["MINIMAL"] = 1] = "MINIMAL";
    DetailLevel[DetailLevel["BASIC"] = 2] = "BASIC";
    DetailLevel[DetailLevel["STANDARD"] = 3] = "STANDARD";
    DetailLevel[DetailLevel["DETAILED"] = 4] = "DETAILED";
    DetailLevel[DetailLevel["COMPREHENSIVE"] = 5] = "COMPREHENSIVE";
})(DetailLevel || (exports.DetailLevel = DetailLevel = {}));
/**
 * Response guidelines configuration for each detail level
 */
const RESPONSE_GUIDELINES = {
    [DetailLevel.MINIMAL]: {
        level: DetailLevel.MINIMAL,
        short_answer_max_words: 10,
        detailed_summary_bullets: 1,
        min_sources: 1,
        include_reasoning: false,
    },
    [DetailLevel.BASIC]: {
        level: DetailLevel.BASIC,
        short_answer_max_words: 20,
        detailed_summary_bullets: 2,
        min_sources: 1,
        include_reasoning: false,
    },
    [DetailLevel.STANDARD]: {
        level: DetailLevel.STANDARD,
        short_answer_max_words: 40,
        detailed_summary_bullets: 4,
        min_sources: 2,
        include_reasoning: true,
    },
    [DetailLevel.DETAILED]: {
        level: DetailLevel.DETAILED,
        short_answer_max_words: 60,
        detailed_summary_bullets: 6,
        min_sources: 3,
        include_reasoning: true,
    },
    [DetailLevel.COMPREHENSIVE]: {
        level: DetailLevel.COMPREHENSIVE,
        short_answer_max_words: 80,
        detailed_summary_bullets: 8,
        min_sources: 4,
        include_reasoning: true,
    },
};
/**
 * Detail Level Analyzer Class
 *
 * Analyzes query complexity and assigns appropriate detail level
 * Uses rule-based pattern matching (no ML)
 */
class DetailLevelAnalyzer {
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
    analyzeQuery(query, intent, entities = []) {
        const lowerQuery = query.toLowerCase().trim();
        // Rule 1: Yes/no questions → MINIMAL (1)
        if (this.isYesNoQuestion(lowerQuery)) {
            return DetailLevel.MINIMAL;
        }
        // Rule 2: Simple fact lookup → BASIC (2)
        if (this.isSimpleFactLookup(lowerQuery)) {
            return DetailLevel.BASIC;
        }
        // Rule 3: Analysis/comparison keywords → COMPREHENSIVE (5)
        if (this.isComplexAnalysis(lowerQuery)) {
            return DetailLevel.COMPREHENSIVE;
        }
        // Rule 4: Multiple entities or time periods → DETAILED (4)
        if (this.hasMultipleComplexElements(lowerQuery, entities)) {
            return DetailLevel.DETAILED;
        }
        // Rule 5: Intent-based classification
        const intentLevel = this.getDetailLevelFromIntent(intent);
        if (intentLevel !== DetailLevel.STANDARD) {
            return intentLevel;
        }
        // Default: STANDARD (3)
        return DetailLevel.STANDARD;
    }
    /**
     * Analyze query with detailed reasoning
     *
     * @param query - Natural language query
     * @param intent - Classified query intent
     * @param entities - Extracted entities (optional)
     * @returns Detailed analysis with reasoning
     */
    analyzeWithReasoning(query, intent, entities = []) {
        const lowerQuery = query.toLowerCase().trim();
        const reasoning = [];
        let level;
        let confidence = 1.0;
        // Check yes/no questions
        if (this.isYesNoQuestion(lowerQuery)) {
            level = DetailLevel.MINIMAL;
            reasoning.push('Yes/no question pattern detected');
            reasoning.push(`Query length: ${query.length} characters (short)`);
        }
        // Check simple fact lookup
        else if (this.isSimpleFactLookup(lowerQuery)) {
            level = DetailLevel.BASIC;
            reasoning.push('Simple fact lookup pattern (what/when/who)');
            reasoning.push(`Query length: ${query.length} characters`);
        }
        // Check complex analysis
        else if (this.isComplexAnalysis(lowerQuery)) {
            level = DetailLevel.COMPREHENSIVE;
            reasoning.push('Complex analysis keywords detected');
            const keywords = this.getComplexAnalysisKeywords(lowerQuery);
            reasoning.push(`Keywords: ${keywords.join(', ')}`);
        }
        // Check multiple complex elements
        else if (this.hasMultipleComplexElements(lowerQuery, entities)) {
            level = DetailLevel.DETAILED;
            reasoning.push('Multiple complex elements detected');
            reasoning.push(`Entity count: ${entities.length}`);
            const timeReferences = this.countTimeReferences(lowerQuery);
            if (timeReferences > 1) {
                reasoning.push(`Time references: ${timeReferences}`);
            }
        }
        // Intent-based
        else {
            const intentLevel = this.getDetailLevelFromIntent(intent);
            if (intentLevel !== DetailLevel.STANDARD) {
                level = intentLevel;
                reasoning.push(`Intent-based classification: ${intent}`);
                confidence = 0.7;
            }
            else {
                level = DetailLevel.STANDARD;
                reasoning.push('Default standard retrieval');
                confidence = 0.6;
            }
        }
        return {
            level,
            confidence,
            reasoning,
            guidelines: this.getResponseGuidelines(level),
        };
    }
    /**
     * Get response guidelines for a detail level
     *
     * @param level - Detail level
     * @returns Response formatting guidelines
     */
    getResponseGuidelines(level) {
        return RESPONSE_GUIDELINES[level];
    }
    /**
     * Get all response guidelines
     *
     * @returns All response guidelines by level
     */
    getAllGuidelines() {
        return RESPONSE_GUIDELINES;
    }
    /**
     * Get detail level description
     *
     * @param level - Detail level
     * @returns Human-readable description
     */
    getDescription(level) {
        const descriptions = {
            [DetailLevel.MINIMAL]: 'Minimal (Yes/no, quick fact)',
            [DetailLevel.BASIC]: 'Basic (Simple query, one fact)',
            [DetailLevel.STANDARD]: 'Standard (Normal retrieval, multiple facts)',
            [DetailLevel.DETAILED]: 'Detailed (Analysis, comparison)',
            [DetailLevel.COMPREHENSIVE]: 'Comprehensive (Complex multi-faceted analysis)',
        };
        return descriptions[level];
    }
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
    isYesNoQuestion(query) {
        // Pattern: Starts with auxiliary verb + short query
        const yesNoPattern = /^(did|was|is|are|can|will|has|have|does|do|were)\s+/i;
        if (yesNoPattern.test(query) && query.length < 100) {
            return true;
        }
        // Pattern: Ends with question mark and contains yes/no verbs
        if (query.endsWith('?')) {
            const containsYesNoVerb = /(is|are|was|were|did|does|do|can|will|has|have)\s+/i.test(query);
            if (containsYesNoVerb && query.length < 100) {
                return true;
            }
        }
        return false;
    }
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
    isSimpleFactLookup(query) {
        const simpleFactPattern = /^(what|when|who|where|which)\s+/i;
        // Must start with fact-finding word and be relatively short
        if (simpleFactPattern.test(query) && query.length < 120) {
            // Not a "why" or "how" question (those are more complex)
            if (!/^(why|how)\s+/i.test(query)) {
                return true;
            }
        }
        return false;
    }
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
    isComplexAnalysis(query) {
        const analysisKeywords = [
            'analyze',
            'analyse',
            'compare',
            'contrast',
            'explain',
            'why',
            'how does',
            'how did',
            'how has',
            'trend',
            'trends',
            'pattern',
            'patterns',
            'correlation',
            'relationship',
            'impact',
            'effect',
            'influence',
            'outcome',
            'outcomes',
            'effectiveness',
            'efficacy',
            'evaluate',
            'assessment',
            'review',
        ];
        for (const keyword of analysisKeywords) {
            if (query.includes(keyword)) {
                return true;
            }
        }
        // Pattern: "how" + verb (complex explanation)
        if (/\bhow\s+(does|did|has|have|is|are|was|were)\b/i.test(query)) {
            return true;
        }
        return false;
    }
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
    hasMultipleComplexElements(query, entities) {
        // Check entity count
        if (entities.length >= 3) {
            return true;
        }
        // Check time references
        const timeReferences = this.countTimeReferences(query);
        if (timeReferences > 1) {
            return true;
        }
        // Check compound conditions
        const hasCompoundConditions = /\b(and|or|plus|along with|in addition to|as well as)\b/i.test(query);
        if (hasCompoundConditions && entities.length >= 2) {
            return true;
        }
        // Check for temporal comparison
        const hasTemporalComparison = /\b(before|after|since|until|during|between|from|to)\b/i.test(query);
        if (hasTemporalComparison && timeReferences > 0) {
            return true;
        }
        return false;
    }
    /**
     * Count time references in query
     *
     * @param query - Lowercase query
     * @returns Number of time references
     */
    countTimeReferences(query) {
        const timePatterns = [
            /\b(month|months)\b/g,
            /\b(week|weeks)\b/g,
            /\b(year|years)\b/g,
            /\b(day|days)\b/g,
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g,
            /\b(last|past|recent|previous|current)\s+(month|week|year|day)/g,
            /\b\d{4}\b/g, // Years like 2024
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Dates like 1/1/2024
        ];
        let count = 0;
        for (const pattern of timePatterns) {
            const matches = query.match(pattern);
            if (matches) {
                count += matches.length;
            }
        }
        return count;
    }
    /**
     * Get complex analysis keywords found in query
     *
     * @param query - Lowercase query
     * @returns Array of keywords found
     */
    getComplexAnalysisKeywords(query) {
        const keywords = [
            'analyze',
            'compare',
            'explain',
            'why',
            'how',
            'trend',
            'pattern',
            'correlation',
            'impact',
            'outcome',
            'effectiveness',
        ];
        return keywords.filter((kw) => query.includes(kw));
    }
    /**
     * Get detail level based on intent
     *
     * @param intent - Query intent
     * @returns Suggested detail level
     */
    getDetailLevelFromIntent(intent) {
        // SUMMARY and COMPARISON intents typically need more detail
        if (intent === intent_classifier_service_1.QueryIntent.SUMMARY) {
            return DetailLevel.DETAILED;
        }
        if (intent === intent_classifier_service_1.QueryIntent.COMPARISON) {
            return DetailLevel.COMPREHENSIVE;
        }
        // Default for other intents
        return DetailLevel.STANDARD;
    }
    /**
     * Batch analyze multiple queries
     *
     * @param queries - Array of queries with intent and entities
     * @returns Array of detail levels
     */
    analyzeBatch(queries) {
        return queries.map(({ query, intent, entities = [] }) => this.analyzeQuery(query, intent, entities));
    }
    /**
     * Batch analyze with reasoning
     *
     * @param queries - Array of queries with intent and entities
     * @returns Array of detail level analyses
     */
    analyzeBatchWithReasoning(queries) {
        return queries.map(({ query, intent, entities = [] }) => this.analyzeWithReasoning(query, intent, entities));
    }
    /**
     * Get level name
     *
     * @param level - Detail level number
     * @returns Level name
     */
    getLevelName(level) {
        const names = {
            [DetailLevel.MINIMAL]: 'MINIMAL',
            [DetailLevel.BASIC]: 'BASIC',
            [DetailLevel.STANDARD]: 'STANDARD',
            [DetailLevel.DETAILED]: 'DETAILED',
            [DetailLevel.COMPREHENSIVE]: 'COMPREHENSIVE',
        };
        return names[level];
    }
    /**
     * Check if query requires reasoning in response
     *
     * @param level - Detail level
     * @returns True if reasoning should be included
     */
    requiresReasoning(level) {
        return this.getResponseGuidelines(level).include_reasoning;
    }
    /**
     * Get minimum number of sources needed
     *
     * @param level - Detail level
     * @returns Minimum sources
     */
    getMinSources(level) {
        return this.getResponseGuidelines(level).min_sources;
    }
    /**
     * Get maximum words for short answer
     *
     * @param level - Detail level
     * @returns Max words
     */
    getMaxAnswerWords(level) {
        return this.getResponseGuidelines(level).short_answer_max_words;
    }
    /**
     * Get number of summary bullets
     *
     * @param level - Detail level
     * @returns Number of bullets
     */
    getSummaryBullets(level) {
        return this.getResponseGuidelines(level).detailed_summary_bullets;
    }
}
// Export singleton instance
const detailLevelAnalyzer = new DetailLevelAnalyzer();
exports.default = detailLevelAnalyzer;
//# sourceMappingURL=detail-level-analyzer.service.js.map