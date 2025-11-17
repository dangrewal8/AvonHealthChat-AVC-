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
/**
 * Pipeline stage
 */
export type PipelineStage = 'query_understanding' | 'retrieval' | 'extraction' | 'generation' | 'formatting';
/**
 * Pipeline context
 */
export interface PipelineContext {
    stage: PipelineStage;
    data: {
        structured_query?: any;
        retrieval_results?: any;
        extractions?: any[];
        generated_answer?: any;
    };
    start_time: number;
    timeout_ms: number;
}
/**
 * Partial result
 */
export interface PartialResult {
    type: 'partial' | 'complete';
    completed_stages: string[];
    failed_stage?: string;
    error_message: string;
    available_data: any;
    user_message: string;
}
/**
 * UI Response (for formatting)
 */
export interface UIResponse {
    query_id: string;
    short_answer: string;
    detailed_summary: string;
    structured_extractions: any[];
    provenance: any[];
    confidence: {
        score: number;
        label: 'high' | 'medium' | 'low';
        reason: string;
    };
    metadata: {
        partial?: boolean;
        completed_stages?: string[];
        error?: string;
        [key: string]: any;
    };
}
/**
 * Partial Results Handler Class
 *
 * Handle partial results when pipeline times out
 */
declare class PartialResultsHandler {
    /**
     * Handle partial result
     *
     * Determines what stages completed and generates user-friendly message
     *
     * @param error - Error that occurred (usually timeout)
     * @param context - Pipeline context with completed stages
     * @returns Partial result with available data
     */
    handlePartialResult(error: Error, context: PipelineContext): PartialResult;
    /**
     * Format partial response for UI
     *
     * Converts partial result to UIResponse format
     *
     * @param partial - Partial result
     * @returns Formatted UI response
     */
    formatPartialResponse(partial: PartialResult): UIResponse;
    /**
     * Determine fallback based on completed stages
     *
     * Returns best available data based on what completed
     *
     * @param completedStages - List of completed stages
     * @param context - Pipeline context
     * @returns Fallback data
     */
    determineFallback(completedStages: string[], context: PipelineContext): any;
    /**
     * Create partial result message
     *
     * Generates user-friendly message based on failed stage
     *
     * @param failedStage - Stage that failed/timed out
     * @param completedStages - Stages that completed successfully
     * @returns User-friendly message
     */
    createPartialMessage(failedStage: PipelineStage, _completedStages: string[]): string;
    /**
     * Check if partial results are available
     *
     * @param context - Pipeline context
     * @returns True if any partial results are available
     */
    hasPartialResults(context: PipelineContext): boolean;
    /**
     * Get completion percentage
     *
     * @param completedStages - List of completed stages
     * @returns Completion percentage (0-100)
     */
    getCompletionPercentage(completedStages: string[]): number;
    /**
     * Explain partial results handler
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const partialResultsHandler: PartialResultsHandler;
export default partialResultsHandler;
//# sourceMappingURL=partial-results-handler.service.d.ts.map