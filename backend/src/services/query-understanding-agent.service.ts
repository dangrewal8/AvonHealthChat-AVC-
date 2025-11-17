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

import { v4 as uuidv4 } from 'uuid';
import temporalParser, { TemporalFilter } from './temporal-parser.service';
import intentClassifier, { QueryIntent } from './intent-classifier.service';
import entityExtractor, { Entity } from './entity-extractor.service';
import detailLevelAnalyzer, { DetailLevel } from './detail-level-analyzer.service';

/**
 * Structured query representation
 */
export interface StructuredQuery {
  original_query: string;
  patient_id: string;
  intent: QueryIntent;
  entities: Entity[];
  temporal_filter: TemporalFilter | null;
  filters: {
    artifact_types?: string[];
    date_range?: {
      from: string;
      to: string;
    };
  };
  detail_level: DetailLevel;
  query_id: string;
}

/**
 * Query parsing result with metadata
 */
export interface QueryParsingResult extends StructuredQuery {
  intent_confidence: number;
  ambiguous_intents?: Array<{
    intent: QueryIntent;
    confidence: number;
  }>;
  entity_count: {
    medications: number;
    conditions: number;
    symptoms: number;
    dates: number;
    persons: number;
  };
  has_temporal: boolean;
}

/**
 * Query Understanding Agent Class
 *
 * Orchestrates all query parsing components to generate structured query representation
 */
class QueryUnderstandingAgent {
  /**
   * Intent to artifact type mapping
   * Maps query intents to relevant medical record artifact types
   * IMPORTANT: These must match the actual artifact_type values in the database (singular forms)
   */
  private readonly intentToArtifactTypes: Record<QueryIntent, string[] | undefined> = {
    [QueryIntent.RETRIEVE_MEDICATIONS]: ['medication'], // Database uses "medication" (singular)
    [QueryIntent.RETRIEVE_CARE_PLANS]: ['care_plan'], // Database uses "care_plan" (singular)
    [QueryIntent.RETRIEVE_NOTES]: ['note', 'document', 'message'], // Database uses singular forms
    [QueryIntent.SUMMARY]: undefined, // No filtering, retrieve all types
    [QueryIntent.COMPARISON]: undefined, // No filtering, need all data for comparison
    [QueryIntent.RETRIEVE_ALL]: undefined, // No filtering by intent
    [QueryIntent.UNKNOWN]: undefined, // No filtering for unknown intent
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
  parse(query: string, patientId: string): StructuredQuery {
    // Validation
    this.validateInput(query, patientId);

    // Step 1: Parse temporal information
    const temporalFilter = temporalParser.parseQuery(query);

    // Step 2: Classify intent
    const intentClassification = intentClassifier.classifyIntent(query);

    // Step 3: Extract entities
    const entities = entityExtractor.extractEntities(query);

    // Step 4: Build filters
    const filters = this.buildFilters(intentClassification.intent, temporalFilter);

    // Step 5: Analyze detail level
    const detailLevel = detailLevelAnalyzer.analyzeQuery(
      query,
      intentClassification.intent,
      entities
    );

    // Step 6: Generate query ID
    const queryId = uuidv4();

    // Construct structured query
    const structuredQuery: StructuredQuery = {
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
  parseWithMetadata(query: string, patientId: string): QueryParsingResult {
    // Get basic structured query
    const structuredQuery = this.parse(query, patientId);

    // Get intent classification with confidence
    const intentClassification = intentClassifier.classifyIntent(query);

    // Count entities by type
    const entityCount = this.countEntitiesByType(structuredQuery.entities);

    // Build result with metadata
    const result: QueryParsingResult = {
      ...structuredQuery,
      intent_confidence: intentClassification.confidence,
      ambiguous_intents: intentClassification.ambiguousIntents,
      entity_count: entityCount,
      has_temporal: temporalParser.hasTemporal(query),
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
  private buildFilters(
    intent: QueryIntent,
    temporalFilter: TemporalFilter | null
  ): StructuredQuery['filters'] {
    const filters: StructuredQuery['filters'] = {};

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
  private countEntitiesByType(entities: Entity[]): QueryParsingResult['entity_count'] {
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
  private validateInput(query: string, patientId: string): void {
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
  getArtifactTypesForIntent(intent: QueryIntent): string[] | undefined {
    return this.intentToArtifactTypes[intent];
  }

  /**
   * Check if query has sufficient context for retrieval
   *
   * @param structuredQuery - Structured query to check
   * @returns True if query has sufficient context
   */
  hasSufficientContext(structuredQuery: StructuredQuery): boolean {
    // Query is sufficient if it has:
    // 1. A known intent (not UNKNOWN)
    // 2. At least one entity OR temporal filter OR specific intent

    if (structuredQuery.intent === QueryIntent.UNKNOWN) {
      return false;
    }

    // Specific intents have sufficient context even without entities
    const specificIntents = [
      QueryIntent.RETRIEVE_MEDICATIONS,
      QueryIntent.RETRIEVE_CARE_PLANS,
      QueryIntent.RETRIEVE_NOTES,
      QueryIntent.SUMMARY,
      QueryIntent.COMPARISON,
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
  getMedications(structuredQuery: StructuredQuery): Entity[] {
    return structuredQuery.entities.filter((e) => e.type === 'medication');
  }

  /**
   * Extract condition entities from structured query
   *
   * @param structuredQuery - Structured query
   * @returns Condition entities
   */
  getConditions(structuredQuery: StructuredQuery): Entity[] {
    return structuredQuery.entities.filter((e) => e.type === 'condition');
  }

  /**
   * Extract symptom entities from structured query
   *
   * @param structuredQuery - Structured query
   * @returns Symptom entities
   */
  getSymptoms(structuredQuery: StructuredQuery): Entity[] {
    return structuredQuery.entities.filter((e) => e.type === 'symptom');
  }

  /**
   * Get query summary for logging
   *
   * @param structuredQuery - Structured query
   * @returns Human-readable summary
   */
  getSummary(structuredQuery: StructuredQuery): string {
    const parts: string[] = [];

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
  parseBatch(queries: Array<{ query: string; patientId: string }>): StructuredQuery[] {
    return queries.map(({ query, patientId }) => this.parse(query, patientId));
  }

  /**
   * Validate and sanitize query
   *
   * @param query - Query to sanitize
   * @returns Sanitized query
   */
  sanitizeQuery(query: string): string {
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
export default queryUnderstandingAgent;
