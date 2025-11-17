"use strict";
/**
 * Partial Results Handler Service
 *
 * Return partial results with clear note when model times out.
 *
 * ChatGPT Requirement: "Return partial results with clear note when model times out"
 * "Partial results: retrieval succeeded but generation timed out — see supporting snippets"
 *
 * Features:
 * - Track pipeline context (which stages completed)
 * - Handle partial results on timeout
 * - Return available data with clear user messages
 * - Format partial results as UIResponse
 * - Fallback to retrieval snippets when generation fails
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/**
 * Partial Results Handler Class
 *
 * Handle partial results when pipeline times out
 */
class PartialResultsHandler {
    /**
     * Handle partial result
     *
     * Determines what stages completed and generates user-friendly message
     *
     * @param error - Error that occurred (usually timeout)
     * @param context - Pipeline context with completed stages
     * @returns Partial result with available data
     */
    handlePartialResult(error, context) {
        // Determine what stages completed
        const completed = [];
        if (context.data.structured_query)
            completed.push('query_understanding');
        if (context.data.retrieval_results)
            completed.push('retrieval');
        if (context.data.extractions)
            completed.push('extraction');
        if (context.data.generated_answer)
            completed.push('generation');
        // Generate user-friendly message based on what we have
        let userMessage = '';
        let availableData = {};
        if (context.data.retrieval_results) {
            // We have retrieval results - can show raw snippets
            userMessage =
                'Query is taking longer than expected. Showing supporting snippets without full analysis.';
            availableData = {
                candidates: context.data.retrieval_results.candidates,
                query: context.data.structured_query,
            };
        }
        else if (context.data.structured_query) {
            // Only query understanding completed
            userMessage = 'Unable to retrieve records at this time. Please try again.';
            availableData = {
                query: context.data.structured_query,
            };
        }
        else {
            // Nothing completed
            userMessage = 'Unable to process query. Please try again.';
            availableData = {};
        }
        return {
            type: 'partial',
            completed_stages: completed,
            failed_stage: context.stage,
            error_message: error.message,
            available_data: availableData,
            user_message: userMessage,
        };
    }
    /**
     * Format partial response for UI
     *
     * Converts partial result to UIResponse format
     *
     * @param partial - Partial result
     * @returns Formatted UI response
     */
    formatPartialResponse(partial) {
        const response = {
            query_id: (0, uuid_1.v4)(),
            short_answer: partial.user_message,
            detailed_summary: '',
            structured_extractions: [],
            provenance: [],
            confidence: {
                score: 0,
                label: 'low',
                reason: 'Partial results due to timeout',
            },
            metadata: {
                partial: true,
                completed_stages: partial.completed_stages,
                error: partial.error_message,
            },
        };
        // If we have retrieval results, add them as raw snippets
        if (partial.available_data.candidates) {
            response.detailed_summary =
                '### Supporting Snippets (unprocessed)\n\n' +
                    partial.available_data.candidates
                        .slice(0, 3)
                        .map((c, i) => `${i + 1}. ${c.snippet} (Score: ${c.score.toFixed(2)})`)
                        .join('\n\n');
            // Add provenance for snippets
            response.provenance = partial.available_data.candidates
                .slice(0, 3)
                .map((c) => ({
                artifact_id: c.artifact_id,
                snippet: c.snippet,
                score: c.score,
            }));
        }
        return response;
    }
    /**
     * Determine fallback based on completed stages
     *
     * Returns best available data based on what completed
     *
     * @param completedStages - List of completed stages
     * @param context - Pipeline context
     * @returns Fallback data
     */
    determineFallback(completedStages, context) {
        // If we have generation, use it (shouldn't happen with timeout)
        if (completedStages.includes('generation')) {
            return {
                type: 'generated_answer',
                data: context.data.generated_answer,
            };
        }
        // If we have extractions, return structured data
        if (completedStages.includes('extraction')) {
            return {
                type: 'structured_extractions',
                data: context.data.extractions,
            };
        }
        // If we have retrieval, return raw snippets
        if (completedStages.includes('retrieval')) {
            return {
                type: 'raw_snippets',
                data: context.data.retrieval_results,
            };
        }
        // If we only have query understanding, return query
        if (completedStages.includes('query_understanding')) {
            return {
                type: 'structured_query',
                data: context.data.structured_query,
            };
        }
        // Nothing available
        return {
            type: 'none',
            data: null,
        };
    }
    /**
     * Create partial result message
     *
     * Generates user-friendly message based on failed stage
     *
     * @param failedStage - Stage that failed/timed out
     * @param completedStages - Stages that completed successfully
     * @returns User-friendly message
     */
    createPartialMessage(failedStage, _completedStages) {
        switch (failedStage) {
            case 'query_understanding':
                return 'Unable to understand your query. Please try rephrasing and try again.';
            case 'retrieval':
                return 'Unable to retrieve records at this time. Please try again.';
            case 'extraction':
                return 'Query is taking longer than expected. Showing retrieval results without detailed analysis.';
            case 'generation':
                return 'Query is taking longer than expected. Showing supporting snippets without full analysis.';
            case 'formatting':
                return 'Query completed but formatting timed out. Showing raw results.';
            default:
                return 'Unable to process query. Please try again.';
        }
    }
    /**
     * Check if partial results are available
     *
     * @param context - Pipeline context
     * @returns True if any partial results are available
     */
    hasPartialResults(context) {
        return (context.data.structured_query !== undefined ||
            context.data.retrieval_results !== undefined ||
            context.data.extractions !== undefined ||
            context.data.generated_answer !== undefined);
    }
    /**
     * Get completion percentage
     *
     * @param completedStages - List of completed stages
     * @returns Completion percentage (0-100)
     */
    getCompletionPercentage(completedStages) {
        const totalStages = 4; // query_understanding, retrieval, extraction, generation
        return Math.round((completedStages.length / totalStages) * 100);
    }
    /**
     * Explain partial results handler
     *
     * @returns Explanation string
     */
    explain() {
        return `Partial Results Handler:

Purpose:
Return partial results with clear note when model times out.

Pipeline Stages:
1. Query Understanding
2. Retrieval
3. Extraction
4. Generation
5. Formatting

Partial Result Scenarios:

Scenario 1: Retrieval succeeded, generation timed out
→ Show supporting snippets without full analysis
→ Message: "Showing supporting snippets without full analysis"

Scenario 2: Only query understanding succeeded
→ Show query interpretation
→ Message: "Unable to retrieve records at this time"

Scenario 3: Extraction succeeded, generation timed out
→ Show structured extractions
→ Message: "Showing structured data without full analysis"

Scenario 4: Nothing succeeded
→ Show generic error
→ Message: "Unable to process query"

Timeout Handling:
- Use Promise.race for timeout
- Track which stages completed
- Return best available data
- Provide clear user message

User Messages:
✓ Clear explanation of what happened
✓ What data is available
✓ Recovery suggestion

Tech Stack: Node.js + Express + TypeScript ONLY
Use built-in Promise.race for timeout`;
    }
}
// Export singleton instance
const partialResultsHandler = new PartialResultsHandler();
exports.default = partialResultsHandler;
//# sourceMappingURL=partial-results-handler.service.js.map