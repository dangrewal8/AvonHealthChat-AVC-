/**
 * Golden Dataset Evaluator
 *
 * Functions for evaluating RAG pipeline results against golden dataset ground truth.
 *
 */
import { GoldenDataset, GoldenDatasetEntry, EvaluationResult, DatasetEvaluationReport } from '../types/golden-dataset.types';
import { UIResponse } from '../types/query.types';
/**
 * Calculate recall@k
 * What fraction of relevant items were retrieved in top k?
 */
export declare function calculateRecall(retrievedIds: string[], relevantIds: string[], k?: number): number;
/**
 * Calculate precision@k
 * What fraction of retrieved items in top k are relevant?
 */
export declare function calculatePrecision(retrievedIds: string[], relevantIds: string[], k?: number): number;
/**
 * Calculate F1 score for extractions
 */
export declare function calculateExtractionF1(actualExtractions: any[], expectedExtractions: any[]): {
    f1: number;
    precision: number;
    recall: number;
};
/**
 * Calculate citation accuracy
 * What fraction of citations point to correct artifacts?
 */
export declare function calculateCitationAccuracy(actualCitations: Array<{
    artifact_id: string;
}>, relevantIds: string[]): number;
/**
 * Evaluate a single query result against golden dataset entry
 */
export declare function evaluateQueryResult(entry: GoldenDatasetEntry, result: UIResponse, retrievedArtifactIds: string[]): EvaluationResult;
/**
 * Evaluate entire dataset
 */
export declare function evaluateDataset(dataset: GoldenDataset, queryExecutor: (query: string, patientId: string) => Promise<{
    result: UIResponse;
    retrievedIds: string[];
}>): Promise<DatasetEvaluationReport>;
/**
 * Export evaluation report to JSON
 */
export declare function exportEvaluationReport(report: DatasetEvaluationReport, pretty?: boolean): string;
/**
 * Print evaluation summary to console
 */
export declare function printEvaluationSummary(report: DatasetEvaluationReport): void;
//# sourceMappingURL=golden-dataset-evaluator.d.ts.map