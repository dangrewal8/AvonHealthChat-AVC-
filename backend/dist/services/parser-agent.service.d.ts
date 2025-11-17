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
import { ParsedChunk, ParserResult, ParserStatistics } from '../types/parsed-chunk.types';
import { ClinicalEntity } from '../types/clinical-entity.types';
/**
 * Parser Agent Class
 *
 * Orchestrates text chunking and entity extraction
 */
declare class ParserAgent {
    /**
     * Batch size for processing artifacts
     */
    private readonly BATCH_SIZE;
    /**
     * Parse artifacts into enriched chunks
     *
     * Main entry point for parsing pipeline
     *
     * @param artifacts - Artifacts to parse
     * @returns Array of parsed chunks with entities
     */
    parse(artifacts: Artifact[]): ParsedChunk[];
    /**
     * Parse with detailed result
     *
     * Returns comprehensive parsing result with statistics and errors
     *
     * @param artifacts - Artifacts to parse
     * @returns Parser result with chunks, statistics, and errors
     */
    parseWithResult(artifacts: Artifact[]): ParserResult;
    /**
     * Parse in batches
     *
     * Process artifacts in batches for better memory management
     *
     * @param artifacts - Artifacts to parse
     * @param batchSize - Optional batch size (default: 10)
     * @returns Array of parsed chunks
     */
    parseInBatches(artifacts: Artifact[], batchSize?: number): ParsedChunk[];
    /**
     * Get parsing statistics
     *
     * Analyze parsed chunks for statistics
     *
     * @param artifacts - Original artifacts
     * @param result - Parser result
     * @returns Parser statistics
     */
    getStatistics(artifacts: Artifact[], result: ParserResult): ParserStatistics;
    /**
     * Validate artifact
     *
     * Ensure artifact has required fields
     *
     * @param artifact - Artifact to validate
     * @throws Error if artifact is invalid
     */
    private validateArtifact;
    /**
     * Filter chunks by entity type
     *
     * Get chunks containing specific entity types
     *
     * @param chunks - Parsed chunks
     * @param entityType - Entity type to filter by
     * @returns Filtered chunks
     */
    filterByEntityType(chunks: ParsedChunk[], entityType: 'medication' | 'condition' | 'symptom' | 'procedure' | 'dosage'): ParsedChunk[];
    /**
     * Find chunks with specific entity
     *
     * Search for chunks containing a specific entity text
     *
     * @param chunks - Parsed chunks
     * @param entityText - Entity text to search for (case-insensitive)
     * @returns Matching chunks
     */
    findChunksWithEntity(chunks: ParsedChunk[], entityText: string): ParsedChunk[];
    /**
     * Get all unique entities
     *
     * Extract unique entities from parsed chunks
     *
     * @param chunks - Parsed chunks
     * @returns Array of unique entities
     */
    getUniqueEntities(chunks: ParsedChunk[]): ClinicalEntity[];
    /**
     * Explain Parser Agent
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const parserAgent: ParserAgent;
export default parserAgent;
//# sourceMappingURL=parser-agent.service.d.ts.map