/**
 * Human Evaluation Framework Types
 *
 * Type definitions for qualitative assessment of RAG pipeline responses.
 *
 */
import { UIResponse } from './query.types';
/**
 * Rating scale for evaluation criteria
 */
export type RatingScore = 1 | 2 | 3 | 4 | 5;
/**
 * Rating scale descriptions
 */
export declare const RATING_SCALE: {
    readonly 5: "Excellent";
    readonly 4: "Good";
    readonly 3: "Acceptable";
    readonly 2: "Poor";
    readonly 1: "Unacceptable";
};
/**
 * Evaluation criteria ratings
 */
export interface EvaluationRatings {
    /**
     * Accuracy: Is the answer factually correct?
     * 5=Excellent, 4=Good, 3=Acceptable, 2=Poor, 1=Unacceptable
     */
    accuracy: RatingScore;
    /**
     * Completeness: Does it answer all parts of the question?
     * 5=Excellent, 4=Good, 3=Acceptable, 2=Poor, 1=Unacceptable
     */
    completeness: RatingScore;
    /**
     * Citation Quality: Are sources relevant and properly cited?
     * 5=Excellent, 4=Good, 3=Acceptable, 2=Poor, 1=Unacceptable
     */
    citation_quality: RatingScore;
    /**
     * Relevance: Is the response on-topic?
     * 5=Excellent, 4=Good, 3=Acceptable, 2=Poor, 1=Unacceptable
     */
    relevance: RatingScore;
}
/**
 * Human evaluation for a single query response
 */
export interface HumanEvaluation {
    /**
     * Unique identifier for the query being evaluated
     */
    query_id: string;
    /**
     * The original query text
     */
    query_text: string;
    /**
     * The response that was evaluated
     */
    response: UIResponse;
    /**
     * Ratings for each evaluation criterion
     */
    ratings: EvaluationRatings;
    /**
     * List of specific issues identified during evaluation
     */
    issues: string[];
    /**
     * Additional notes from the evaluator
     */
    notes: string;
    /**
     * Name or ID of the person who performed the evaluation
     */
    evaluator: string;
    /**
     * Timestamp when the evaluation was submitted (ISO 8601 format)
     */
    timestamp: string;
    /**
     * Unique identifier for this evaluation
     */
    evaluation_id?: string;
}
/**
 * Request body for submitting a new evaluation
 */
export interface SubmitEvaluationRequest {
    query_id: string;
    query_text: string;
    response: UIResponse;
    ratings: EvaluationRatings;
    issues?: string[];
    notes?: string;
    evaluator: string;
}
/**
 * Response for evaluation submission
 */
export interface SubmitEvaluationResponse {
    evaluation_id: string;
    timestamp: string;
    message: string;
}
/**
 * Statistics for a single criterion
 */
export interface CriterionStats {
    /**
     * Arithmetic mean of all ratings
     */
    mean: number;
    /**
     * Median rating value
     */
    median: number;
    /**
     * Most common rating value
     */
    mode: number;
    /**
     * Standard deviation of ratings
     */
    stddev: number;
    /**
     * Distribution of ratings (count for each score 1-5)
     */
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
/**
 * Aggregated evaluation statistics
 */
export interface EvaluationStatistics {
    /**
     * Total number of evaluations
     */
    total_evaluations: number;
    /**
     * Number of unique evaluators
     */
    unique_evaluators: number;
    /**
     * Number of unique queries evaluated
     */
    unique_queries: number;
    /**
     * Statistics for each evaluation criterion
     */
    criteria: {
        accuracy: CriterionStats;
        completeness: CriterionStats;
        citation_quality: CriterionStats;
        relevance: CriterionStats;
    };
    /**
     * Overall average score across all criteria
     */
    overall_average: number;
    /**
     * Most common issues reported
     */
    common_issues: Array<{
        issue: string;
        count: number;
        percentage: number;
    }>;
    /**
     * Time range of evaluations
     */
    time_range: {
        earliest: string;
        latest: string;
    };
}
/**
 * Evaluation report with detailed breakdown
 */
export interface EvaluationReport {
    /**
     * Summary statistics
     */
    statistics: EvaluationStatistics;
    /**
     * Individual evaluations
     */
    evaluations: HumanEvaluation[];
    /**
     * Queries with lowest average ratings
     */
    lowest_rated_queries: Array<{
        query_id: string;
        query_text: string;
        average_rating: number;
        evaluation_count: number;
    }>;
    /**
     * Queries with highest average ratings
     */
    highest_rated_queries: Array<{
        query_id: string;
        query_text: string;
        average_rating: number;
        evaluation_count: number;
    }>;
    /**
     * Report generation timestamp
     */
    generated_at: string;
}
/**
 * Query parameters for retrieving evaluations
 */
export interface GetEvaluationsQuery {
    /**
     * Filter by query ID
     */
    query_id?: string;
    /**
     * Filter by evaluator
     */
    evaluator?: string;
    /**
     * Filter by minimum rating (any criterion)
     */
    min_rating?: number;
    /**
     * Filter by maximum rating (any criterion)
     */
    max_rating?: number;
    /**
     * Filter by date range start (ISO 8601)
     */
    start_date?: string;
    /**
     * Filter by date range end (ISO 8601)
     */
    end_date?: string;
    /**
     * Limit number of results
     */
    limit?: number;
    /**
     * Offset for pagination
     */
    offset?: number;
}
/**
 * Response for retrieving evaluations
 */
export interface GetEvaluationsResponse {
    evaluations: HumanEvaluation[];
    total_count: number;
    limit: number;
    offset: number;
}
/**
 * Evaluation criteria descriptions
 */
export declare const EVALUATION_CRITERIA: {
    readonly accuracy: {
        readonly name: "Accuracy";
        readonly description: "Is the answer factually correct?";
        readonly guidelines: readonly ["5 - All facts are correct and verified", "4 - Facts are mostly correct with minor issues", "3 - Some facts are correct, some questionable", "2 - Many facts are incorrect or unverified", "1 - Facts are incorrect or misleading"];
    };
    readonly completeness: {
        readonly name: "Completeness";
        readonly description: "Does it answer all parts of the question?";
        readonly guidelines: readonly ["5 - Fully answers all aspects of the question", "4 - Answers most aspects with minor gaps", "3 - Answers some aspects, missing key information", "2 - Partial answer with significant gaps", "1 - Fails to answer the question"];
    };
    readonly citation_quality: {
        readonly name: "Citation Quality";
        readonly description: "Are sources relevant and properly cited?";
        readonly guidelines: readonly ["5 - All citations are relevant and accurate", "4 - Citations are mostly relevant and accurate", "3 - Some citations are relevant, some questionable", "2 - Many citations are irrelevant or inaccurate", "1 - No citations or completely irrelevant"];
    };
    readonly relevance: {
        readonly name: "Relevance";
        readonly description: "Is the response on-topic?";
        readonly guidelines: readonly ["5 - Completely on-topic and focused", "4 - Mostly on-topic with minor tangents", "3 - Somewhat on-topic with noticeable drift", "2 - Frequently off-topic", "1 - Completely off-topic or irrelevant"];
    };
};
/**
 * Common issues that can be reported during evaluation
 */
export declare const COMMON_ISSUES: readonly ["Missing information", "Incorrect facts", "Irrelevant sources", "Missing citations", "Off-topic content", "Incomplete answer", "Unclear explanation", "Contradictory information", "Out of date information", "Poor formatting", "Other"];
export type CommonIssue = (typeof COMMON_ISSUES)[number];
//# sourceMappingURL=evaluation.types.d.ts.map