"use strict";
/**
 * Query Understanding Agent (QUA) Service
 *
 * Orchestrates query parsing components to generate structured query representation
 *
 * Features:
 * - Temporal information parsing
 * - Intent classification
 * - Entity extraction
 * - Filter construction
 * - Query validation
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const temporal_parser_service_1 = __importDefault(require("./temporal-parser.service"));
const intent_classifier_service_1 = __importStar(require("./intent-classifier.service"));
const entity_extractor_service_1 = __importDefault(require("./entity-extractor.service"));
const detail_level_analyzer_service_1 = __importDefault(require("./detail-level-analyzer.service"));
/**
 * Query Understanding Agent Class
 *
 * Orchestrates all query parsing components to generate structured query representation
 */
class QueryUnderstandingAgent {
    /**
     * Intent to artifact type mapping
     * Maps query intents to relevant medical record artifact types
     */
    intentToArtifactTypes = {
        [intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS]: ['medication_order', 'prescription', 'medication_list'],
        [intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS]: [
            'care_plan',
            'treatment_plan',
            'care_coordination',
            'care_management',
        ],
        [intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES]: [
            'progress_note',
            'clinical_note',
            'encounter',
            'visit_note',
            'consultation_note',
        ],
        [intent_classifier_service_1.QueryIntent.SUMMARY]: undefined, // No filtering, retrieve all types
        [intent_classifier_service_1.QueryIntent.COMPARISON]: undefined, // No filtering, need all data for comparison
        [intent_classifier_service_1.QueryIntent.RETRIEVE_ALL]: undefined, // No filtering by intent
        [intent_classifier_service_1.QueryIntent.UNKNOWN]: undefined, // No filtering for unknown intent
    };
    /**
     * Parse query and generate structured representation
     *
     * @param query - Natural language query
     * @param patientId - Patient identifier
     * @returns Structured query with filters and metadata
     *
     * @example
     * parse("What medications for diabetes in the last 3 months?", "patient_123")
     * // Returns: {
     * //   original_query: "What medications for diabetes in the last 3 months?",
     * //   patient_id: "patient_123",
     * //   intent: "retrieve_medications",
     * //   entities: [...],
     * //   temporal_filter: {...},
     * //   filters: {
     * //     artifact_types: ["medication_order", "prescription"],
     * //     date_range: { from: "2024-07-15T00:00:00.000Z", to: "2024-10-15T23:59:59.999Z" }
     * //   },
     * //   detail_level: 3,
     * //   query_id: "550e8400-e29b-41d4-a716-446655440000"
     * // }
     */
    parse(query, patientId) {
        // Validation
        this.validateInput(query, patientId);
        // Step 1: Parse temporal information
        const temporalFilter = temporal_parser_service_1.default.parseQuery(query);
        // Step 2: Classify intent
        const intentClassification = intent_classifier_service_1.default.classifyIntent(query);
        // Step 3: Extract entities
        const entities = entity_extractor_service_1.default.extractEntities(query);
        // Step 4: Build filters
        const filters = this.buildFilters(intentClassification.intent, temporalFilter);
        // Step 5: Analyze detail level
        const detailLevel = detail_level_analyzer_service_1.default.analyzeQuery(query, intentClassification.intent, entities);
        // Step 6: Generate query ID
        const queryId = (0, uuid_1.v4)();
        // Construct structured query
        const structuredQuery = {
            original_query: query,
            patient_id: patientId,
            intent: intentClassification.intent,
            entities,
            temporal_filter: temporalFilter,
            filters,
            detail_level: detailLevel,
            query_id: queryId,
        };
        return structuredQuery;
    }
    /**
     * Parse query with extended metadata
     *
     * @param query - Natural language query
     * @param patientId - Patient identifier
     * @returns Query parsing result with additional metadata
     */
    parseWithMetadata(query, patientId) {
        // Get basic structured query
        const structuredQuery = this.parse(query, patientId);
        // Get intent classification with confidence
        const intentClassification = intent_classifier_service_1.default.classifyIntent(query);
        // Count entities by type
        const entityCount = this.countEntitiesByType(structuredQuery.entities);
        // Build result with metadata
        const result = {
            ...structuredQuery,
            intent_confidence: intentClassification.confidence,
            ambiguous_intents: intentClassification.ambiguousIntents,
            entity_count: entityCount,
            has_temporal: temporal_parser_service_1.default.hasTemporal(query),
        };
        return result;
    }
    /**
     * Build filters based on intent and temporal info
     *
     * @param intent - Classified query intent
     * @param temporalFilter - Temporal filter (if any)
     * @returns Filter object
     */
    buildFilters(intent, temporalFilter) {
        const filters = {};
        // Map intent to artifact types
        const artifactTypes = this.intentToArtifactTypes[intent];
        if (artifactTypes && artifactTypes.length > 0) {
            filters.artifact_types = artifactTypes;
        }
        // Add temporal date range if present
        if (temporalFilter) {
            filters.date_range = {
                from: temporalFilter.dateFrom,
                to: temporalFilter.dateTo,
            };
        }
        return filters;
    }
    /**
     * Count entities by type
     *
     * @param entities - List of entities
     * @returns Count by entity type
     */
    countEntitiesByType(entities) {
        const count = {
            medications: 0,
            conditions: 0,
            symptoms: 0,
            dates: 0,
            persons: 0,
        };
        for (const entity of entities) {
            switch (entity.type) {
                case 'medication':
                    count.medications++;
                    break;
                case 'condition':
                    count.conditions++;
                    break;
                case 'symptom':
                    count.symptoms++;
                    break;
                case 'date':
                    count.dates++;
                    break;
                case 'person':
                    count.persons++;
                    break;
            }
        }
        return count;
    }
    /**
     * Validate input parameters
     *
     * @param query - Query to validate
     * @param patientId - Patient ID to validate
     * @throws Error if validation fails
     */
    validateInput(query, patientId) {
        if (!query || query.trim().length === 0) {
            throw new Error('Query cannot be empty');
        }
        if (query.trim().length > 1000) {
            throw new Error('Query is too long (max 1000 characters)');
        }
        if (!patientId || patientId.trim().length === 0) {
            throw new Error('Patient ID cannot be empty');
        }
    }
    /**
     * Get artifact types for a specific intent
     *
     * @param intent - Query intent
     * @returns Artifact types or undefined
     */
    getArtifactTypesForIntent(intent) {
        return this.intentToArtifactTypes[intent];
    }
    /**
     * Check if query has sufficient context for retrieval
     *
     * @param structuredQuery - Structured query to check
     * @returns True if query has sufficient context
     */
    hasSufficientContext(structuredQuery) {
        // Query is sufficient if it has:
        // 1. A known intent (not UNKNOWN)
        // 2. At least one entity OR temporal filter OR specific intent
        if (structuredQuery.intent === intent_classifier_service_1.QueryIntent.UNKNOWN) {
            return false;
        }
        // Specific intents have sufficient context even without entities
        const specificIntents = [
            intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
            intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS,
            intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES,
            intent_classifier_service_1.QueryIntent.SUMMARY,
            intent_classifier_service_1.QueryIntent.COMPARISON,
        ];
        if (specificIntents.includes(structuredQuery.intent)) {
            return true;
        }
        // Otherwise, need entities or temporal filter
        return structuredQuery.entities.length > 0 || structuredQuery.temporal_filter !== null;
    }
    /**
     * Extract medication entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Medication entities
     */
    getMedications(structuredQuery) {
        return structuredQuery.entities.filter((e) => e.type === 'medication');
    }
    /**
     * Extract condition entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Condition entities
     */
    getConditions(structuredQuery) {
        return structuredQuery.entities.filter((e) => e.type === 'condition');
    }
    /**
     * Extract symptom entities from structured query
     *
     * @param structuredQuery - Structured query
     * @returns Symptom entities
     */
    getSymptoms(structuredQuery) {
        return structuredQuery.entities.filter((e) => e.type === 'symptom');
    }
    /**
     * Get query summary for logging
     *
     * @param structuredQuery - Structured query
     * @returns Human-readable summary
     */
    getSummary(structuredQuery) {
        const parts = [];
        parts.push(`Intent: ${structuredQuery.intent}`);
        if (structuredQuery.entities.length > 0) {
            parts.push(`Entities: ${structuredQuery.entities.length}`);
        }
        if (structuredQuery.temporal_filter) {
            parts.push(`Temporal: ${structuredQuery.temporal_filter.timeReference}`);
        }
        if (structuredQuery.filters.artifact_types) {
            parts.push(`Artifacts: ${structuredQuery.filters.artifact_types.join(', ')}`);
        }
        parts.push(`Detail Level: ${structuredQuery.detail_level}`);
        return parts.join(' | ');
    }
    /**
     * Batch parse multiple queries
     *
     * @param queries - Array of queries with patient IDs
     * @returns Array of structured queries
     */
    parseBatch(queries) {
        return queries.map(({ query, patientId }) => this.parse(query, patientId));
    }
    /**
     * Validate and sanitize query
     *
     * @param query - Query to sanitize
     * @returns Sanitized query
     */
    sanitizeQuery(query) {
        // Trim whitespace
        let sanitized = query.trim();
        // Remove multiple spaces
        sanitized = sanitized.replace(/\s+/g, ' ');
        // Remove special characters that might cause issues
        sanitized = sanitized.replace(/[^\w\s.,?!'-]/g, '');
        return sanitized;
    }
}
// Export singleton instance
const queryUnderstandingAgent = new QueryUnderstandingAgent();
exports.default = queryUnderstandingAgent;
//# sourceMappingURL=query-understanding-agent.service.js.map