/**
 * Golden Dataset Builder
 *
 * Utility for building, validating, and saving golden datasets for RAG testing.
 *
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  GoldenDataset,
  GoldenDatasetEntry,
  ValidationResult,
  DatasetCategory,
  CATEGORY_DISTRIBUTION,
} from '../types/golden-dataset.types';

/**
 * GoldenDatasetBuilder Class
 *
 * Manages creation and validation of golden datasets.
 */
export class GoldenDatasetBuilder {
  private entries: GoldenDatasetEntry[] = [];
  private version: string;
  private metadata?: GoldenDataset['metadata'];

  constructor(version: string = '1.0.0') {
    this.version = version;
  }

  /**
   * Add a single entry to the dataset
   */
  addEntry(entry: GoldenDatasetEntry): void {
    // Validate entry before adding
    const validation = this.validateEntry(entry);
    if (!validation.valid) {
      throw new Error(
        `Invalid entry ${entry.id}: ${validation.errors.join(', ')}`
      );
    }

    // Check for duplicate IDs
    if (this.entries.some((e) => e.id === entry.id)) {
      throw new Error(`Duplicate entry ID: ${entry.id}`);
    }

    this.entries.push(entry);
  }

  /**
   * Add multiple entries at once
   */
  addEntries(entries: GoldenDatasetEntry[]): void {
    entries.forEach((entry) => this.addEntry(entry));
  }

  /**
   * Set dataset metadata
   */
  setMetadata(metadata: GoldenDataset['metadata']): void {
    this.metadata = metadata;
  }

  /**
   * Build the complete dataset
   */
  build(): GoldenDataset {
    // Calculate category counts
    const categories: Record<DatasetCategory, number> = {
      medication: 0,
      care_plan: 0,
      temporal: 0,
      entity: 0,
      negative: 0,
      ambiguous: 0,
    };

    this.entries.forEach((entry) => {
      categories[entry.category]++;
    });

    return {
      version: this.version,
      created_at: new Date().toISOString(),
      total_entries: this.entries.length,
      entries: this.entries,
      categories,
      metadata: this.metadata,
    };
  }

  /**
   * Save dataset to JSON file
   */
  async save(filepath: string): Promise<void> {
    const dataset = this.build();

    // Ensure directory exists
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file with pretty formatting
    await fs.writeFile(filepath, JSON.stringify(dataset, null, 2), 'utf-8');
  }

  /**
   * Validate entire dataset
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum entries
    if (this.entries.length < 50) {
      errors.push(
        `Dataset has ${this.entries.length} entries, minimum is 50`
      );
    }

    if (this.entries.length > 200) {
      warnings.push(
        `Dataset has ${this.entries.length} entries, recommended maximum is 200`
      );
    }

    // Check category distribution
    const categoryCounts: Record<string, number> = {};
    this.entries.forEach((entry) => {
      categoryCounts[entry.category] =
        (categoryCounts[entry.category] || 0) + 1;
    });

    Object.entries(CATEGORY_DISTRIBUTION).forEach(
      ([category, expectedCount]) => {
        const actualCount = categoryCounts[category] || 0;
        if (actualCount < expectedCount * 0.8) {
          warnings.push(
            `Category ${category} has ${actualCount} entries, expected around ${expectedCount}`
          );
        }
      }
    );

    // Validate each entry
    this.entries.forEach((entry) => {
      const validation = this.validateEntry(entry);
      if (!validation.valid) {
        errors.push(`Entry ${entry.id}: ${validation.errors.join(', ')}`);
      }
      validation.warnings.forEach((warning) => {
        warnings.push(`Entry ${entry.id}: ${warning}`);
      });
    });

    // Check for duplicate IDs
    const ids = new Set<string>();
    this.entries.forEach((entry) => {
      if (ids.has(entry.id)) {
        errors.push(`Duplicate entry ID: ${entry.id}`);
      }
      ids.add(entry.id);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single entry
   */
  validateEntry(entry: GoldenDatasetEntry): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!entry.id) errors.push('Missing id');
    if (!entry.category) errors.push('Missing category');
    if (!entry.query) errors.push('Missing query');
    if (!entry.patient_id) errors.push('Missing patient_id');
    if (!entry.expected_intent) errors.push('Missing expected_intent');
    if (!entry.ground_truth) errors.push('Missing ground_truth');
    if (!entry.acceptance_criteria) errors.push('Missing acceptance_criteria');
    if (!entry.created_at) errors.push('Missing created_at');

    // Validate ground truth
    if (entry.ground_truth) {
      if (!Array.isArray(entry.ground_truth.relevant_artifact_ids)) {
        errors.push('ground_truth.relevant_artifact_ids must be an array');
      }

      if (!Array.isArray(entry.ground_truth.expected_extractions)) {
        errors.push('ground_truth.expected_extractions must be an array');
      }

      if (
        typeof entry.ground_truth.expected_confidence_min !== 'number' ||
        entry.ground_truth.expected_confidence_min < 0 ||
        entry.ground_truth.expected_confidence_min > 1
      ) {
        errors.push(
          'ground_truth.expected_confidence_min must be between 0 and 1'
        );
      }

      if (
        typeof entry.ground_truth.expected_sources_min !== 'number' ||
        entry.ground_truth.expected_sources_min < 0
      ) {
        errors.push('ground_truth.expected_sources_min must be positive');
      }

      // Warn if no relevant artifacts for non-negative queries
      if (
        entry.category !== 'negative' &&
        entry.ground_truth.relevant_artifact_ids.length === 0
      ) {
        warnings.push(
          'Non-negative query has no relevant artifacts specified'
        );
      }

      // Negative queries should have no relevant artifacts
      if (
        entry.category === 'negative' &&
        entry.ground_truth.relevant_artifact_ids.length > 0
      ) {
        errors.push('Negative query should have no relevant artifacts');
      }
    }

    // Validate acceptance criteria
    if (entry.acceptance_criteria) {
      const criteria = entry.acceptance_criteria;

      if (
        typeof criteria.recall_at_5_min !== 'number' ||
        criteria.recall_at_5_min < 0 ||
        criteria.recall_at_5_min > 1
      ) {
        errors.push('recall_at_5_min must be between 0 and 1');
      }

      if (
        typeof criteria.precision_at_5_min !== 'number' ||
        criteria.precision_at_5_min < 0 ||
        criteria.precision_at_5_min > 1
      ) {
        errors.push('precision_at_5_min must be between 0 and 1');
      }

      if (
        typeof criteria.extraction_f1_min !== 'number' ||
        criteria.extraction_f1_min < 0 ||
        criteria.extraction_f1_min > 1
      ) {
        errors.push('extraction_f1_min must be between 0 and 1');
      }

      if (
        typeof criteria.citation_accuracy_min !== 'number' ||
        criteria.citation_accuracy_min < 0 ||
        criteria.citation_accuracy_min > 1
      ) {
        errors.push('citation_accuracy_min must be between 0 and 1');
      }
    }

    // Validate expected entities
    if (!Array.isArray(entry.expected_entities)) {
      errors.push('expected_entities must be an array');
    }

    // Validate timestamp
    if (entry.created_at) {
      const date = new Date(entry.created_at);
      if (isNaN(date.getTime())) {
        errors.push('created_at must be valid ISO 8601 timestamp');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get current entry count
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Get entries by category
   */
  getEntriesByCategory(category: DatasetCategory): GoldenDatasetEntry[] {
    return this.entries.filter((entry) => entry.category === category);
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Record<DatasetCategory, number> {
    const stats: Record<DatasetCategory, number> = {
      medication: 0,
      care_plan: 0,
      temporal: 0,
      entity: 0,
      negative: 0,
      ambiguous: 0,
    };

    this.entries.forEach((entry) => {
      stats[entry.category]++;
    });

    return stats;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Remove entry by ID
   */
  removeEntry(id: string): boolean {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.entries.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update existing entry
   */
  updateEntry(id: string, updates: Partial<GoldenDatasetEntry>): boolean {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.entries[index] = { ...this.entries[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Export statistics about the dataset
   */
  getStatistics() {
    const categoryStats = this.getCategoryStats();
    const totalEntries = this.entries.length;

    const avgRelevantArtifacts =
      this.entries.reduce(
        (sum, e) => sum + e.ground_truth.relevant_artifact_ids.length,
        0
      ) / totalEntries || 0;

    const avgExpectedExtractions =
      this.entries.reduce(
        (sum, e) => sum + e.ground_truth.expected_extractions.length,
        0
      ) / totalEntries || 0;

    const avgConfidenceMin =
      this.entries.reduce(
        (sum, e) => sum + e.ground_truth.expected_confidence_min,
        0
      ) / totalEntries || 0;

    return {
      total_entries: totalEntries,
      category_distribution: categoryStats,
      avg_relevant_artifacts: Math.round(avgRelevantArtifacts * 100) / 100,
      avg_expected_extractions:
        Math.round(avgExpectedExtractions * 100) / 100,
      avg_confidence_min: Math.round(avgConfidenceMin * 100) / 100,
      verified_entries: this.entries.filter((e) => e.verified_by).length,
    };
  }
}

/**
 * Load golden dataset from JSON file
 */
export async function loadGoldenDataset(
  filepath: string
): Promise<GoldenDataset> {
  const content = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(content) as GoldenDataset;
}

/**
 * Create a new golden dataset builder
 */
export function createGoldenDatasetBuilder(
  version: string = '1.0.0'
): GoldenDatasetBuilder {
  return new GoldenDatasetBuilder(version);
}
