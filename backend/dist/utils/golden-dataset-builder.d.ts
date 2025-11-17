/**
 * Golden Dataset Builder
 *
 * Utility for building, validating, and saving golden datasets for RAG testing.
 *
 */
import { GoldenDataset, GoldenDatasetEntry, ValidationResult, DatasetCategory } from '../types/golden-dataset.types';
/**
 * GoldenDatasetBuilder Class
 *
 * Manages creation and validation of golden datasets.
 */
export declare class GoldenDatasetBuilder {
    private entries;
    private version;
    private metadata?;
    constructor(version?: string);
    /**
     * Add a single entry to the dataset
     */
    addEntry(entry: GoldenDatasetEntry): void;
    /**
     * Add multiple entries at once
     */
    addEntries(entries: GoldenDatasetEntry[]): void;
    /**
     * Set dataset metadata
     */
    setMetadata(metadata: GoldenDataset['metadata']): void;
    /**
     * Build the complete dataset
     */
    build(): GoldenDataset;
    /**
     * Save dataset to JSON file
     */
    save(filepath: string): Promise<void>;
    /**
     * Validate entire dataset
     */
    validate(): ValidationResult;
    /**
     * Validate a single entry
     */
    validateEntry(entry: GoldenDatasetEntry): ValidationResult;
    /**
     * Get current entry count
     */
    getEntryCount(): number;
    /**
     * Get entries by category
     */
    getEntriesByCategory(category: DatasetCategory): GoldenDatasetEntry[];
    /**
     * Get category statistics
     */
    getCategoryStats(): Record<DatasetCategory, number>;
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Remove entry by ID
     */
    removeEntry(id: string): boolean;
    /**
     * Update existing entry
     */
    updateEntry(id: string, updates: Partial<GoldenDatasetEntry>): boolean;
    /**
     * Export statistics about the dataset
     */
    getStatistics(): {
        total_entries: number;
        category_distribution: Record<DatasetCategory, number>;
        avg_relevant_artifacts: number;
        avg_expected_extractions: number;
        avg_confidence_min: number;
        verified_entries: number;
    };
}
/**
 * Load golden dataset from JSON file
 */
export declare function loadGoldenDataset(filepath: string): Promise<GoldenDataset>;
/**
 * Create a new golden dataset builder
 */
export declare function createGoldenDatasetBuilder(version?: string): GoldenDatasetBuilder;
//# sourceMappingURL=golden-dataset-builder.d.ts.map