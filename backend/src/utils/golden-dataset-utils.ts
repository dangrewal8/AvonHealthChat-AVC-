/**
 * Golden Dataset Utilities
 *
 * Helper functions for working with golden datasets.
 *
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  GoldenDataset,
  GoldenDatasetEntry,
  DatasetCategory,
} from '../types/golden-dataset.types';

/**
 * Load golden dataset from JSON file
 */
export async function loadGoldenDataset(filepath: string): Promise<GoldenDataset> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as GoldenDataset;
  } catch (error) {
    throw new Error(`Failed to load golden dataset from ${filepath}: ${error}`);
  }
}

/**
 * Get entries by category
 */
export function getEntriesByCategory(
  dataset: GoldenDataset,
  category: DatasetCategory
): GoldenDatasetEntry[] {
  return dataset.entries.filter((entry) => entry.category === category);
}

/**
 * Get entry by ID
 */
export function getEntryById(
  dataset: GoldenDataset,
  id: string
): GoldenDatasetEntry | undefined {
  return dataset.entries.find((entry) => entry.id === id);
}

/**
 * Filter entries by difficulty
 */
export function filterByDifficulty(
  dataset: GoldenDataset,
  difficulty: 'easy' | 'medium' | 'hard'
): GoldenDatasetEntry[] {
  return dataset.entries.filter(
    (entry) => entry.metadata?.difficulty === difficulty
  );
}

/**
 * Filter entries by tags
 */
export function filterByTags(
  dataset: GoldenDataset,
  tags: string[]
): GoldenDatasetEntry[] {
  return dataset.entries.filter((entry) =>
    tags.some((tag) => entry.metadata?.tags?.includes(tag))
  );
}

/**
 * Get random sample of entries
 */
export function getRandomSample(
  dataset: GoldenDataset,
  sampleSize: number
): GoldenDatasetEntry[] {
  const shuffled = [...dataset.entries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, sampleSize);
}

/**
 * Get stratified sample (proportional to category distribution)
 */
export function getStratifiedSample(
  dataset: GoldenDataset,
  totalSize: number
): GoldenDatasetEntry[] {
  const sample: GoldenDatasetEntry[] = [];
  const categories = Object.keys(dataset.categories) as DatasetCategory[];

  categories.forEach((category) => {
    const categoryEntries = getEntriesByCategory(dataset, category);
    const categoryProportion = dataset.categories[category] / dataset.total_entries;
    const categorySize = Math.round(totalSize * categoryProportion);

    const shuffled = [...categoryEntries].sort(() => Math.random() - 0.5);
    sample.push(...shuffled.slice(0, categorySize));
  });

  return sample;
}

/**
 * Export dataset statistics to markdown
 */
export function exportStatsToMarkdown(dataset: GoldenDataset): string {
  const lines: string[] = [];

  lines.push(`# Golden Dataset Statistics`);
  lines.push(``);
  lines.push(`**Version**: ${dataset.version}`);
  lines.push(`**Created**: ${dataset.created_at}`);
  lines.push(`**Total Entries**: ${dataset.total_entries}`);
  lines.push(``);

  if (dataset.metadata) {
    lines.push(`## Metadata`);
    lines.push(``);
    if (dataset.metadata.description) {
      lines.push(`**Description**: ${dataset.metadata.description}`);
    }
    if (dataset.metadata.author) {
      lines.push(`**Author**: ${dataset.metadata.author}`);
    }
    if (dataset.metadata.purpose) {
      lines.push(`**Purpose**: ${dataset.metadata.purpose}`);
    }
    lines.push(``);
  }

  lines.push(`## Category Distribution`);
  lines.push(``);
  lines.push(`| Category | Count | Percentage |`);
  lines.push(`|----------|-------|------------|`);

  Object.entries(dataset.categories).forEach(([category, count]) => {
    const percentage = ((count / dataset.total_entries) * 100).toFixed(1);
    lines.push(`| ${category} | ${count} | ${percentage}% |`);
  });

  lines.push(``);

  // Difficulty distribution
  const difficultyCount = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  dataset.entries.forEach((entry) => {
    if (entry.metadata?.difficulty) {
      difficultyCount[entry.metadata.difficulty]++;
    }
  });

  lines.push(`## Difficulty Distribution`);
  lines.push(``);
  lines.push(`| Difficulty | Count | Percentage |`);
  lines.push(`|------------|-------|------------|`);

  Object.entries(difficultyCount).forEach(([difficulty, count]) => {
    const percentage = ((count / dataset.total_entries) * 100).toFixed(1);
    lines.push(`| ${difficulty} | ${count} | ${percentage}% |`);
  });

  lines.push(``);

  // Verified entries
  const verifiedCount = dataset.entries.filter((e) => e.verified_by).length;
  const verifiedPercentage = ((verifiedCount / dataset.total_entries) * 100).toFixed(1);

  lines.push(`## Verification Status`);
  lines.push(``);
  lines.push(`- **Verified**: ${verifiedCount} (${verifiedPercentage}%)`);
  lines.push(`- **Unverified**: ${dataset.total_entries - verifiedCount} (${(100 - parseFloat(verifiedPercentage)).toFixed(1)}%)`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * Compare two datasets
 */
export function compareDatasets(
  dataset1: GoldenDataset,
  dataset2: GoldenDataset
): {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
} {
  const ids1 = new Set(dataset1.entries.map((e) => e.id));
  const ids2 = new Set(dataset2.entries.map((e) => e.id));

  const added = dataset2.entries
    .filter((e) => !ids1.has(e.id))
    .map((e) => e.id);

  const removed = dataset1.entries
    .filter((e) => !ids2.has(e.id))
    .map((e) => e.id);

  const modified: string[] = [];
  const unchanged: string[] = [];

  dataset1.entries.forEach((entry1) => {
    if (ids2.has(entry1.id)) {
      const entry2 = dataset2.entries.find((e) => e.id === entry1.id)!;

      // Simple comparison - check if query or ground truth changed
      if (
        entry1.query !== entry2.query ||
        JSON.stringify(entry1.ground_truth) !==
          JSON.stringify(entry2.ground_truth)
      ) {
        modified.push(entry1.id);
      } else {
        unchanged.push(entry1.id);
      }
    }
  });

  return { added, removed, modified, unchanged };
}

/**
 * Merge two datasets (union of entries)
 */
export function mergeDatasets(
  dataset1: GoldenDataset,
  dataset2: GoldenDataset,
  preferSecond: boolean = true
): GoldenDataset {
  const entriesMap = new Map<string, GoldenDatasetEntry>();

  // Add all from dataset1
  dataset1.entries.forEach((entry) => {
    entriesMap.set(entry.id, entry);
  });

  // Add/override from dataset2
  dataset2.entries.forEach((entry) => {
    if (!entriesMap.has(entry.id) || preferSecond) {
      entriesMap.set(entry.id, entry);
    }
  });

  const entries = Array.from(entriesMap.values());

  // Recalculate category counts
  const categories: Record<DatasetCategory, number> = {
    medication: 0,
    care_plan: 0,
    temporal: 0,
    entity: 0,
    negative: 0,
    ambiguous: 0,
  };

  entries.forEach((entry) => {
    categories[entry.category]++;
  });

  return {
    version: dataset2.version,
    created_at: new Date().toISOString(),
    total_entries: entries.length,
    entries,
    categories,
    metadata: dataset2.metadata,
  };
}

/**
 * Split dataset into train/test sets
 */
export function splitDataset(
  dataset: GoldenDataset,
  testRatio: number = 0.2
): {
  train: GoldenDataset;
  test: GoldenDataset;
} {
  const testSize = Math.floor(dataset.total_entries * testRatio);
  const trainSize = dataset.total_entries - testSize;

  // Stratified split by category
  const trainEntries: GoldenDatasetEntry[] = [];
  const testEntries: GoldenDatasetEntry[] = [];

  const categories = Object.keys(dataset.categories) as DatasetCategory[];

  categories.forEach((category) => {
    const categoryEntries = getEntriesByCategory(dataset, category);
    const categoryTestSize = Math.floor(categoryEntries.length * testRatio);

    // Shuffle
    const shuffled = [...categoryEntries].sort(() => Math.random() - 0.5);

    testEntries.push(...shuffled.slice(0, categoryTestSize));
    trainEntries.push(...shuffled.slice(categoryTestSize));
  });

  const createDataset = (entries: GoldenDatasetEntry[]): GoldenDataset => {
    const categories: Record<DatasetCategory, number> = {
      medication: 0,
      care_plan: 0,
      temporal: 0,
      entity: 0,
      negative: 0,
      ambiguous: 0,
    };

    entries.forEach((entry) => {
      categories[entry.category]++;
    });

    return {
      version: dataset.version,
      created_at: new Date().toISOString(),
      total_entries: entries.length,
      entries,
      categories,
      metadata: dataset.metadata,
    };
  };

  return {
    train: createDataset(trainEntries),
    test: createDataset(testEntries),
  };
}

/**
 * Export dataset to CSV format
 */
export function exportToCSV(dataset: GoldenDataset): string {
  const headers = [
    'ID',
    'Category',
    'Query',
    'Patient ID',
    'Expected Intent',
    'Relevant Artifacts',
    'Expected Confidence Min',
    'Expected Sources Min',
    'Recall@5 Min',
    'Precision@5 Min',
    'Extraction F1 Min',
    'Citation Accuracy Min',
    'Difficulty',
    'Verified By',
  ];

  const rows = dataset.entries.map((entry) => [
    entry.id,
    entry.category,
    `"${entry.query.replace(/"/g, '""')}"`,
    entry.patient_id,
    entry.expected_intent,
    entry.ground_truth.relevant_artifact_ids.length.toString(),
    entry.ground_truth.expected_confidence_min.toFixed(2),
    entry.ground_truth.expected_sources_min.toString(),
    entry.acceptance_criteria.recall_at_5_min.toFixed(2),
    entry.acceptance_criteria.precision_at_5_min.toFixed(2),
    entry.acceptance_criteria.extraction_f1_min.toFixed(2),
    entry.acceptance_criteria.citation_accuracy_min.toFixed(2),
    entry.metadata?.difficulty || '',
    entry.verified_by || '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
