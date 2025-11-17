/**
 * Golden Dataset Utilities
 *
 * Helper functions for working with golden datasets.
 *
 */
import { GoldenDataset, GoldenDatasetEntry, DatasetCategory } from '../types/golden-dataset.types';
/**
 * Load golden dataset from JSON file
 */
export declare function loadGoldenDataset(filepath: string): Promise<GoldenDataset>;
/**
 * Get entries by category
 */
export declare function getEntriesByCategory(dataset: GoldenDataset, category: DatasetCategory): GoldenDatasetEntry[];
/**
 * Get entry by ID
 */
export declare function getEntryById(dataset: GoldenDataset, id: string): GoldenDatasetEntry | undefined;
/**
 * Filter entries by difficulty
 */
export declare function filterByDifficulty(dataset: GoldenDataset, difficulty: 'easy' | 'medium' | 'hard'): GoldenDatasetEntry[];
/**
 * Filter entries by tags
 */
export declare function filterByTags(dataset: GoldenDataset, tags: string[]): GoldenDatasetEntry[];
/**
 * Get random sample of entries
 */
export declare function getRandomSample(dataset: GoldenDataset, sampleSize: number): GoldenDatasetEntry[];
/**
 * Get stratified sample (proportional to category distribution)
 */
export declare function getStratifiedSample(dataset: GoldenDataset, totalSize: number): GoldenDatasetEntry[];
/**
 * Export dataset statistics to markdown
 */
export declare function exportStatsToMarkdown(dataset: GoldenDataset): string;
/**
 * Compare two datasets
 */
export declare function compareDatasets(dataset1: GoldenDataset, dataset2: GoldenDataset): {
    added: string[];
    removed: string[];
    modified: string[];
    unchanged: string[];
};
/**
 * Merge two datasets (union of entries)
 */
export declare function mergeDatasets(dataset1: GoldenDataset, dataset2: GoldenDataset, preferSecond?: boolean): GoldenDataset;
/**
 * Split dataset into train/test sets
 */
export declare function splitDataset(dataset: GoldenDataset, testRatio?: number): {
    train: GoldenDataset;
    test: GoldenDataset;
};
/**
 * Export dataset to CSV format
 */
export declare function exportToCSV(dataset: GoldenDataset): string;
//# sourceMappingURL=golden-dataset-utils.d.ts.map