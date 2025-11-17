/**
 * Parser Agent Service
 *
 * Orchestrates chunking and entity extraction for artifacts.
 *
 * Requirements:
 * - Parse artifacts into enriched chunks
 * - Extract clinical entities from each chunk
 * - Batch processing for efficiency
 * - Error handling and validation
 *
 */

import { Artifact } from '../types/artifact.types';
import {
  ParsedChunk,
  ParserResult,
  ParserError,
  ParserStatistics,
} from '../types/parsed-chunk.types';
import textChunker from './text-chunker.service';
import clinicalNER from './clinical-ner.service';
import { ClinicalEntity } from '../types/clinical-entity.types';

/**
 * Parser Agent Class
 *
 * Orchestrates text chunking and entity extraction
 */
class ParserAgent {
  /**
   * Batch size for processing artifacts
   */
  private readonly BATCH_SIZE = 10;

  /**
   * Parse artifacts into enriched chunks
   *
   * Main entry point for parsing pipeline
   *
   * @param artifacts - Artifacts to parse
   * @returns Array of parsed chunks with entities
   */
  parse(artifacts: Artifact[]): ParsedChunk[] {
    const allChunks: ParsedChunk[] = [];
    const errors: ParserError[] = [];

    // Process each artifact
    for (const artifact of artifacts) {
      try {
        // Validate artifact
        this.validateArtifact(artifact);

        // Chunk the artifact
        const chunks = textChunker.chunk(artifact);

        // Extract entities from each chunk
        for (const chunk of chunks) {
          const entities = clinicalNER.extractEntities(chunk.chunk_text);

          // Create parsed chunk
          const parsedChunk: ParsedChunk = {
            ...chunk,
            entities,
          };

          allChunks.push(parsedChunk);
        }
      } catch (error) {
        // Capture error but continue processing
        errors.push({
          artifact_id: artifact.id,
          error: error instanceof Error ? error.name : 'Unknown error',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Log errors if any
    if (errors.length > 0) {
      console.warn(`Parser Agent: ${errors.length} artifacts failed to parse`);
      for (const error of errors) {
        console.warn(`  - ${error.artifact_id}: ${error.message}`);
      }
    }

    return allChunks;
  }

  /**
   * Parse with detailed result
   *
   * Returns comprehensive parsing result with statistics and errors
   *
   * @param artifacts - Artifacts to parse
   * @returns Parser result with chunks, statistics, and errors
   */
  parseWithResult(artifacts: Artifact[]): ParserResult {
    const startTime = Date.now();
    const chunks: ParsedChunk[] = [];
    const errors: ParserError[] = [];

    // Process each artifact
    for (const artifact of artifacts) {
      try {
        // Validate artifact
        this.validateArtifact(artifact);

        // Chunk the artifact
        const artifactChunks = textChunker.chunk(artifact);

        // Extract entities from each chunk
        for (const chunk of artifactChunks) {
          const entities = clinicalNER.extractEntities(chunk.chunk_text);

          // Create parsed chunk
          const parsedChunk: ParsedChunk = {
            ...chunk,
            entities,
          };

          chunks.push(parsedChunk);
        }
      } catch (error) {
        // Capture error but continue processing
        errors.push({
          artifact_id: artifact.id,
          error: error instanceof Error ? error.name : 'Unknown error',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    }

    const processingTime = Date.now() - startTime;

    // Calculate total entities
    const totalEntities = chunks.reduce(
      (sum, chunk) => sum + chunk.entities.length,
      0
    );

    return {
      chunks,
      total_chunks: chunks.length,
      total_entities: totalEntities,
      artifacts_processed: artifacts.length - errors.length,
      processing_time_ms: processingTime,
      errors,
    };
  }

  /**
   * Parse in batches
   *
   * Process artifacts in batches for better memory management
   *
   * @param artifacts - Artifacts to parse
   * @param batchSize - Optional batch size (default: 10)
   * @returns Array of parsed chunks
   */
  parseInBatches(
    artifacts: Artifact[],
    batchSize: number = this.BATCH_SIZE
  ): ParsedChunk[] {
    const allChunks: ParsedChunk[] = [];
    const totalBatches = Math.ceil(artifacts.length / batchSize);

    console.log(
      `Parser Agent: Processing ${artifacts.length} artifacts in ${totalBatches} batches`
    );

    for (let i = 0; i < artifacts.length; i += batchSize) {
      const batch = artifacts.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(
        `Parser Agent: Processing batch ${batchNumber}/${totalBatches} (${batch.length} artifacts)`
      );

      const batchChunks = this.parse(batch);
      allChunks.push(...batchChunks);
    }

    console.log(
      `Parser Agent: Completed processing. Total chunks: ${allChunks.length}`
    );

    return allChunks;
  }

  /**
   * Get parsing statistics
   *
   * Analyze parsed chunks for statistics
   *
   * @param artifacts - Original artifacts
   * @param result - Parser result
   * @returns Parser statistics
   */
  getStatistics(artifacts: Artifact[], result: ParserResult): ParserStatistics {
    const entitiesByType = {
      medication: 0,
      condition: 0,
      symptom: 0,
      procedure: 0,
      dosage: 0,
    };

    // Count entities by type
    for (const chunk of result.chunks) {
      for (const entity of chunk.entities) {
        entitiesByType[entity.type]++;
      }
    }

    const successful = result.artifacts_processed;
    const failed = result.errors.length;

    return {
      total_artifacts: artifacts.length,
      successful,
      failed,
      total_chunks: result.total_chunks,
      total_entities: result.total_entities,
      avg_chunks_per_artifact:
        successful > 0 ? result.total_chunks / successful : 0,
      avg_entities_per_chunk:
        result.total_chunks > 0
          ? result.total_entities / result.total_chunks
          : 0,
      entities_by_type: entitiesByType,
    };
  }

  /**
   * Validate artifact
   *
   * Ensure artifact has required fields
   *
   * @param artifact - Artifact to validate
   * @throws Error if artifact is invalid
   */
  private validateArtifact(artifact: Artifact): void {
    if (!artifact) {
      throw new Error('Artifact is null or undefined');
    }

    if (!artifact.id) {
      throw new Error('Artifact missing required field: id');
    }

    if (!artifact.patient_id) {
      throw new Error('Artifact missing required field: patient_id');
    }

    if (!artifact.type) {
      throw new Error('Artifact missing required field: type');
    }

    if (!artifact.text || artifact.text.trim().length === 0) {
      throw new Error('Artifact missing or empty text content');
    }

    if (!artifact.occurred_at) {
      throw new Error('Artifact missing required field: occurred_at');
    }

    if (!artifact.source) {
      throw new Error('Artifact missing required field: source');
    }

    // Validate date format
    try {
      new Date(artifact.occurred_at);
    } catch {
      throw new Error('Artifact occurred_at is not a valid ISO 8601 date');
    }
  }

  /**
   * Filter chunks by entity type
   *
   * Get chunks containing specific entity types
   *
   * @param chunks - Parsed chunks
   * @param entityType - Entity type to filter by
   * @returns Filtered chunks
   */
  filterByEntityType(
    chunks: ParsedChunk[],
    entityType: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage'
  ): ParsedChunk[] {
    return chunks.filter((chunk) =>
      chunk.entities.some((entity) => entity.type === entityType)
    );
  }

  /**
   * Find chunks with specific entity
   *
   * Search for chunks containing a specific entity text
   *
   * @param chunks - Parsed chunks
   * @param entityText - Entity text to search for (case-insensitive)
   * @returns Matching chunks
   */
  findChunksWithEntity(
    chunks: ParsedChunk[],
    entityText: string
  ): ParsedChunk[] {
    const searchText = entityText.toLowerCase();

    return chunks.filter((chunk) =>
      chunk.entities.some(
        (entity) =>
          entity.text.toLowerCase() === searchText ||
          entity.normalized.toLowerCase() === searchText
      )
    );
  }

  /**
   * Get all unique entities
   *
   * Extract unique entities from parsed chunks
   *
   * @param chunks - Parsed chunks
   * @returns Array of unique entities
   */
  getUniqueEntities(chunks: ParsedChunk[]): ClinicalEntity[] {
    const uniqueMap = new Map<string, ClinicalEntity>();

    for (const chunk of chunks) {
      for (const entity of chunk.entities) {
        // Use normalized text as key for uniqueness
        const key = `${entity.type}:${entity.normalized.toLowerCase()}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, entity);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Explain Parser Agent
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Parser Agent:

Purpose:
Orchestrate text chunking and clinical entity extraction for artifacts.

Pipeline:
1. Validate artifact (required fields, date format)
2. Chunk artifact using TextChunker
   - 200-300 words per chunk
   - 50 word overlap
   - Preserve sentence boundaries
3. Extract entities from each chunk using ClinicalNER
   - Medications, dosages, conditions, symptoms, procedures
   - Medical abbreviations expanded
   - Entity normalization
4. Attach entities to chunks
5. Return enriched ParsedChunk objects

Batch Processing:
- Default batch size: ${this.BATCH_SIZE} artifacts
- Process large datasets efficiently
- Memory-friendly for big imports

Error Handling:
- Validates all required fields
- Continues processing on individual failures
- Collects and reports all errors
- Never fails entire batch on single error

Output:
- ParsedChunk: Chunk + entities + metadata
- embedding_id field reserved for vector storage
- Ready for immediate indexing

Statistics:
- Total artifacts processed
- Chunks created per artifact
- Entities extracted per chunk
- Breakdown by entity type
- Success/failure counts

Filtering & Search:
- Filter chunks by entity type
- Find chunks containing specific entities
- Extract unique entities across all chunks

Integration:
1. Receive artifacts from EMR adapter
2. Parse into enriched chunks
3. Pass to embedding service
4. Store in vector database
5. Use entities for enhanced search

Tech Stack: Node.js + TypeScript ONLY
NO external NLP libraries`;
  }
}

// Export singleton instance
const parserAgent = new ParserAgent();
export default parserAgent;
