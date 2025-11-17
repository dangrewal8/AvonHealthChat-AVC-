"use strict";
/**
 * Golden Dataset Utilities
 *
 * Helper functions for working with golden datasets.
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGoldenDataset = loadGoldenDataset;
exports.getEntriesByCategory = getEntriesByCategory;
exports.getEntryById = getEntryById;
exports.filterByDifficulty = filterByDifficulty;
exports.filterByTags = filterByTags;
exports.getRandomSample = getRandomSample;
exports.getStratifiedSample = getStratifiedSample;
exports.exportStatsToMarkdown = exportStatsToMarkdown;
exports.compareDatasets = compareDatasets;
exports.mergeDatasets = mergeDatasets;
exports.splitDataset = splitDataset;
exports.exportToCSV = exportToCSV;
const fs = __importStar(require("fs/promises"));
/**
 * Load golden dataset from JSON file
 */
async function loadGoldenDataset(filepath) {
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        throw new Error(`Failed to load golden dataset from ${filepath}: ${error}`);
    }
}
/**
 * Get entries by category
 */
function getEntriesByCategory(dataset, category) {
    return dataset.entries.filter((entry) => entry.category === category);
}
/**
 * Get entry by ID
 */
function getEntryById(dataset, id) {
    return dataset.entries.find((entry) => entry.id === id);
}
/**
 * Filter entries by difficulty
 */
function filterByDifficulty(dataset, difficulty) {
    return dataset.entries.filter((entry) => entry.metadata?.difficulty === difficulty);
}
/**
 * Filter entries by tags
 */
function filterByTags(dataset, tags) {
    return dataset.entries.filter((entry) => tags.some((tag) => entry.metadata?.tags?.includes(tag)));
}
/**
 * Get random sample of entries
 */
function getRandomSample(dataset, sampleSize) {
    const shuffled = [...dataset.entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, sampleSize);
}
/**
 * Get stratified sample (proportional to category distribution)
 */
function getStratifiedSample(dataset, totalSize) {
    const sample = [];
    const categories = Object.keys(dataset.categories);
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
function exportStatsToMarkdown(dataset) {
    const lines = [];
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
function compareDatasets(dataset1, dataset2) {
    const ids1 = new Set(dataset1.entries.map((e) => e.id));
    const ids2 = new Set(dataset2.entries.map((e) => e.id));
    const added = dataset2.entries
        .filter((e) => !ids1.has(e.id))
        .map((e) => e.id);
    const removed = dataset1.entries
        .filter((e) => !ids2.has(e.id))
        .map((e) => e.id);
    const modified = [];
    const unchanged = [];
    dataset1.entries.forEach((entry1) => {
        if (ids2.has(entry1.id)) {
            const entry2 = dataset2.entries.find((e) => e.id === entry1.id);
            // Simple comparison - check if query or ground truth changed
            if (entry1.query !== entry2.query ||
                JSON.stringify(entry1.ground_truth) !==
                    JSON.stringify(entry2.ground_truth)) {
                modified.push(entry1.id);
            }
            else {
                unchanged.push(entry1.id);
            }
        }
    });
    return { added, removed, modified, unchanged };
}
/**
 * Merge two datasets (union of entries)
 */
function mergeDatasets(dataset1, dataset2, preferSecond = true) {
    const entriesMap = new Map();
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
    const categories = {
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
function splitDataset(dataset, testRatio = 0.2) {
    const testSize = Math.floor(dataset.total_entries * testRatio);
    const trainSize = dataset.total_entries - testSize;
    // Stratified split by category
    const trainEntries = [];
    const testEntries = [];
    const categories = Object.keys(dataset.categories);
    categories.forEach((category) => {
        const categoryEntries = getEntriesByCategory(dataset, category);
        const categoryTestSize = Math.floor(categoryEntries.length * testRatio);
        // Shuffle
        const shuffled = [...categoryEntries].sort(() => Math.random() - 0.5);
        testEntries.push(...shuffled.slice(0, categoryTestSize));
        trainEntries.push(...shuffled.slice(categoryTestSize));
    });
    const createDataset = (entries) => {
        const categories = {
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
function exportToCSV(dataset) {
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
//# sourceMappingURL=golden-dataset-utils.js.map