"use strict";
/**
 * Golden Dataset Builder
 *
 * Utility for building, validating, and saving golden datasets for RAG testing.
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
exports.GoldenDatasetBuilder = void 0;
exports.loadGoldenDataset = loadGoldenDataset;
exports.createGoldenDatasetBuilder = createGoldenDatasetBuilder;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const golden_dataset_types_1 = require("../types/golden-dataset.types");
/**
 * GoldenDatasetBuilder Class
 *
 * Manages creation and validation of golden datasets.
 */
class GoldenDatasetBuilder {
    entries = [];
    version;
    metadata;
    constructor(version = '1.0.0') {
        this.version = version;
    }
    /**
     * Add a single entry to the dataset
     */
    addEntry(entry) {
        // Validate entry before adding
        const validation = this.validateEntry(entry);
        if (!validation.valid) {
            throw new Error(`Invalid entry ${entry.id}: ${validation.errors.join(', ')}`);
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
    addEntries(entries) {
        entries.forEach((entry) => this.addEntry(entry));
    }
    /**
     * Set dataset metadata
     */
    setMetadata(metadata) {
        this.metadata = metadata;
    }
    /**
     * Build the complete dataset
     */
    build() {
        // Calculate category counts
        const categories = {
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
    async save(filepath) {
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
    validate() {
        const errors = [];
        const warnings = [];
        // Check minimum entries
        if (this.entries.length < 50) {
            errors.push(`Dataset has ${this.entries.length} entries, minimum is 50`);
        }
        if (this.entries.length > 200) {
            warnings.push(`Dataset has ${this.entries.length} entries, recommended maximum is 200`);
        }
        // Check category distribution
        const categoryCounts = {};
        this.entries.forEach((entry) => {
            categoryCounts[entry.category] =
                (categoryCounts[entry.category] || 0) + 1;
        });
        Object.entries(golden_dataset_types_1.CATEGORY_DISTRIBUTION).forEach(([category, expectedCount]) => {
            const actualCount = categoryCounts[category] || 0;
            if (actualCount < expectedCount * 0.8) {
                warnings.push(`Category ${category} has ${actualCount} entries, expected around ${expectedCount}`);
            }
        });
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
        const ids = new Set();
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
    validateEntry(entry) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!entry.id)
            errors.push('Missing id');
        if (!entry.category)
            errors.push('Missing category');
        if (!entry.query)
            errors.push('Missing query');
        if (!entry.patient_id)
            errors.push('Missing patient_id');
        if (!entry.expected_intent)
            errors.push('Missing expected_intent');
        if (!entry.ground_truth)
            errors.push('Missing ground_truth');
        if (!entry.acceptance_criteria)
            errors.push('Missing acceptance_criteria');
        if (!entry.created_at)
            errors.push('Missing created_at');
        // Validate ground truth
        if (entry.ground_truth) {
            if (!Array.isArray(entry.ground_truth.relevant_artifact_ids)) {
                errors.push('ground_truth.relevant_artifact_ids must be an array');
            }
            if (!Array.isArray(entry.ground_truth.expected_extractions)) {
                errors.push('ground_truth.expected_extractions must be an array');
            }
            if (typeof entry.ground_truth.expected_confidence_min !== 'number' ||
                entry.ground_truth.expected_confidence_min < 0 ||
                entry.ground_truth.expected_confidence_min > 1) {
                errors.push('ground_truth.expected_confidence_min must be between 0 and 1');
            }
            if (typeof entry.ground_truth.expected_sources_min !== 'number' ||
                entry.ground_truth.expected_sources_min < 0) {
                errors.push('ground_truth.expected_sources_min must be positive');
            }
            // Warn if no relevant artifacts for non-negative queries
            if (entry.category !== 'negative' &&
                entry.ground_truth.relevant_artifact_ids.length === 0) {
                warnings.push('Non-negative query has no relevant artifacts specified');
            }
            // Negative queries should have no relevant artifacts
            if (entry.category === 'negative' &&
                entry.ground_truth.relevant_artifact_ids.length > 0) {
                errors.push('Negative query should have no relevant artifacts');
            }
        }
        // Validate acceptance criteria
        if (entry.acceptance_criteria) {
            const criteria = entry.acceptance_criteria;
            if (typeof criteria.recall_at_5_min !== 'number' ||
                criteria.recall_at_5_min < 0 ||
                criteria.recall_at_5_min > 1) {
                errors.push('recall_at_5_min must be between 0 and 1');
            }
            if (typeof criteria.precision_at_5_min !== 'number' ||
                criteria.precision_at_5_min < 0 ||
                criteria.precision_at_5_min > 1) {
                errors.push('precision_at_5_min must be between 0 and 1');
            }
            if (typeof criteria.extraction_f1_min !== 'number' ||
                criteria.extraction_f1_min < 0 ||
                criteria.extraction_f1_min > 1) {
                errors.push('extraction_f1_min must be between 0 and 1');
            }
            if (typeof criteria.citation_accuracy_min !== 'number' ||
                criteria.citation_accuracy_min < 0 ||
                criteria.citation_accuracy_min > 1) {
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
    getEntryCount() {
        return this.entries.length;
    }
    /**
     * Get entries by category
     */
    getEntriesByCategory(category) {
        return this.entries.filter((entry) => entry.category === category);
    }
    /**
     * Get category statistics
     */
    getCategoryStats() {
        const stats = {
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
    clear() {
        this.entries = [];
    }
    /**
     * Remove entry by ID
     */
    removeEntry(id) {
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
    updateEntry(id, updates) {
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
        const avgRelevantArtifacts = this.entries.reduce((sum, e) => sum + e.ground_truth.relevant_artifact_ids.length, 0) / totalEntries || 0;
        const avgExpectedExtractions = this.entries.reduce((sum, e) => sum + e.ground_truth.expected_extractions.length, 0) / totalEntries || 0;
        const avgConfidenceMin = this.entries.reduce((sum, e) => sum + e.ground_truth.expected_confidence_min, 0) / totalEntries || 0;
        return {
            total_entries: totalEntries,
            category_distribution: categoryStats,
            avg_relevant_artifacts: Math.round(avgRelevantArtifacts * 100) / 100,
            avg_expected_extractions: Math.round(avgExpectedExtractions * 100) / 100,
            avg_confidence_min: Math.round(avgConfidenceMin * 100) / 100,
            verified_entries: this.entries.filter((e) => e.verified_by).length,
        };
    }
}
exports.GoldenDatasetBuilder = GoldenDatasetBuilder;
/**
 * Load golden dataset from JSON file
 */
async function loadGoldenDataset(filepath) {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
}
/**
 * Create a new golden dataset builder
 */
function createGoldenDatasetBuilder(version = '1.0.0') {
    return new GoldenDatasetBuilder(version);
}
//# sourceMappingURL=golden-dataset-builder.js.map