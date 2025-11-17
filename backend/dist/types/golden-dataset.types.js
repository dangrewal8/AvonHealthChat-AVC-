"use strict";
/**
 * Golden Dataset Types
 *
 * Type definitions for golden dataset creation and validation.
 * Used for testing and evaluating RAG pipeline performance.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_ACCEPTANCE_CRITERIA = exports.DEFAULT_ACCEPTANCE_CRITERIA = exports.CATEGORY_DISTRIBUTION = void 0;
/**
 * Category distribution for dataset balance
 */
exports.CATEGORY_DISTRIBUTION = {
    medication: 20, // "What medications did I prescribe?"
    care_plan: 15, // "Show me care plans from last month"
    temporal: 20, // "What changed in the last 3 months?"
    entity: 15, // "Find records mentioning ibuprofen"
    negative: 10, // Should find nothing
    ambiguous: 10, // Unclear queries
};
/**
 * Default acceptance criteria
 */
exports.DEFAULT_ACCEPTANCE_CRITERIA = {
    recall_at_5_min: 0.9,
    precision_at_5_min: 0.8,
    extraction_f1_min: 0.85,
    citation_accuracy_min: 0.95,
};
/**
 * Category-specific acceptance criteria
 */
exports.CATEGORY_ACCEPTANCE_CRITERIA = {
    medication: {
        recall_at_5_min: 0.95,
        precision_at_5_min: 0.9,
        extraction_f1_min: 0.9,
        citation_accuracy_min: 0.98,
    },
    care_plan: {
        recall_at_5_min: 0.9,
        precision_at_5_min: 0.85,
        extraction_f1_min: 0.85,
        citation_accuracy_min: 0.95,
    },
    temporal: {
        recall_at_5_min: 0.85,
        precision_at_5_min: 0.8,
        extraction_f1_min: 0.8,
        citation_accuracy_min: 0.9,
    },
    entity: {
        recall_at_5_min: 0.9,
        precision_at_5_min: 0.85,
        extraction_f1_min: 0.85,
        citation_accuracy_min: 0.95,
    },
    negative: {
        recall_at_5_min: 1.0, // Should return nothing
        precision_at_5_min: 1.0, // Should not return false positives
        extraction_f1_min: 1.0,
        citation_accuracy_min: 1.0,
    },
    ambiguous: {
        recall_at_5_min: 0.7,
        precision_at_5_min: 0.7,
        extraction_f1_min: 0.7,
        citation_accuracy_min: 0.8,
    },
};
//# sourceMappingURL=golden-dataset.types.js.map