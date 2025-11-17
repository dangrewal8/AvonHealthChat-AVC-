/**
 * Enhanced Chunking Service
 *
 * Extends text chunking to use enriched artifact data when available.
 *
 * Key Features:
 * - Uses enriched_text instead of original text for richer chunks
 * - Stores relationship_ids in chunk metadata
 * - Stores extracted_entities in chunk metadata
 * - Persists chunks to PostgreSQL with enrichment data
 * - Falls back to original text if enrichment not available
 *
 * Integration with Phase 3:
 * - Fetches enriched artifacts from enrichment-storage.service
 * - Uses enriched_text which includes clinical context and relationships
 * - Stores chunks in chunk_metadata table with enrichment fields
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import textChunker, { Chunk } from './text-chunker.service';
import enrichmentStorageService from './enrichment-storage.service';
import { Artifact } from '../types/artifact.types';
import { ParsedChunk } from '../types/parsed-chunk.types';

/**
 * Enhanced Chunk Interface
 *
 * Extends base Chunk with enrichment metadata
 */
export interface EnhancedChunk extends Omit<Chunk, 'source'> {
  source_url?: string; // Source URL instead of source
  enriched_text?: string; // Enriched version of chunk_text
  extracted_entities?: Record<string, any>; // Entities from enrichment
  relationship_ids?: string[]; // Related relationship IDs
  context_expansion_level?: number; // 0=none, 1=direct, 2=expanded
}

/**
 * Enhanced Chunking Result
 */
export interface EnhancedChunkingResult {
  chunks: EnhancedChunk[];
  enriched_count: number; // How many chunks used enriched text
  original_count: number; // How many chunks used original text
  total_chunks: number;
  processing_time_ms: number;
}

class EnhancedChunkingService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'avon_health_rag',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('[Enhanced Chunking] PostgreSQL pool initialized');
  }

  /**
   * Chunk artifacts with enrichment
   *
   * Main entry point - chunks artifacts using enriched text when available
   *
   * @param artifacts - Artifacts to chunk
   * @param options - Chunking options
   * @returns Enhanced chunking result
   */
  async chunkWithEnrichment(
    artifacts: Artifact[],
    options?: {
      useEnrichment?: boolean; // Default: true
      storeToDatabase?: boolean; // Default: true
      contextExpansionLevel?: number; // Default: 1 (direct relationships)
    }
  ): Promise<EnhancedChunkingResult> {
    const startTime = Date.now();
    const useEnrichment = options?.useEnrichment !== false;
    const storeToDatabase = options?.storeToDatabase !== false;
    const contextExpansionLevel = options?.contextExpansionLevel || 1;

    console.log(
      `[Enhanced Chunking] Chunking ${artifacts.length} artifacts (enrichment: ${useEnrichment})`
    );

    const allChunks: EnhancedChunk[] = [];
    let enrichedCount = 0;
    let originalCount = 0;

    for (const artifact of artifacts) {
      try {
        let chunks: EnhancedChunk[];

        if (useEnrichment) {
          // Try to get enriched artifact
          const enrichedArtifacts =
            await enrichmentStorageService.getEnrichedArtifactsByPatient(artifact.patient_id);
          const enrichedArtifact = enrichedArtifacts.find(
            (ea) => ea.artifact_id === artifact.id
          );

          if (enrichedArtifact) {
            // Use enriched text for chunking
            chunks = await this.chunkEnrichedArtifact(
              artifact,
              enrichedArtifact,
              contextExpansionLevel
            );
            enrichedCount += chunks.length;
          } else {
            // Fall back to original text
            chunks = await this.chunkOriginalArtifact(artifact);
            originalCount += chunks.length;
          }
        } else {
          // Use original text
          chunks = await this.chunkOriginalArtifact(artifact);
          originalCount += chunks.length;
        }

        allChunks.push(...chunks);
      } catch (error) {
        console.error(
          `[Enhanced Chunking] Failed to chunk artifact ${artifact.id}:`,
          error
        );
        // Fall back to original chunking
        const fallbackChunks = await this.chunkOriginalArtifact(artifact);
        allChunks.push(...fallbackChunks);
        originalCount += fallbackChunks.length;
      }
    }

    // Store chunks to database if requested
    if (storeToDatabase && allChunks.length > 0) {
      await this.storeChunksToDatabase(allChunks);
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Enhanced Chunking] ✓ Created ${allChunks.length} chunks (${enrichedCount} enriched, ${originalCount} original, ${duration}ms)`
    );

    return {
      chunks: allChunks,
      enriched_count: enrichedCount,
      original_count: originalCount,
      total_chunks: allChunks.length,
      processing_time_ms: duration,
    };
  }

  /**
   * Chunk enriched artifact
   *
   * Creates chunks using enriched_text which includes clinical context
   */
  private async chunkEnrichedArtifact(
    artifact: Artifact,
    enrichedArtifact: any,
    contextExpansionLevel: number
  ): Promise<EnhancedChunk[]> {
    // Create a modified artifact with enriched text
    const enrichedArtifactForChunking: Artifact = {
      ...artifact,
      text: enrichedArtifact.enriched_text, // Use enriched text instead of original
    };

    // Chunk the enriched text
    const baseChunks = textChunker.chunk(enrichedArtifactForChunking);

    // Enhance chunks with enrichment metadata
    const enhancedChunks: EnhancedChunk[] = baseChunks.map((chunk) => ({
      ...chunk,
      enriched_text: chunk.chunk_text, // The chunk_text is already from enriched_text
      extracted_entities: enrichedArtifact.extracted_entities,
      relationship_ids: enrichedArtifact.related_artifact_ids || [],
      context_expansion_level: contextExpansionLevel,
    }));

    return enhancedChunks;
  }

  /**
   * Chunk original artifact
   *
   * Fallback to original text chunking when enrichment not available
   */
  private async chunkOriginalArtifact(artifact: Artifact): Promise<EnhancedChunk[]> {
    const baseChunks = textChunker.chunk(artifact);

    // Convert to enhanced chunks (without enrichment data)
    const enhancedChunks: EnhancedChunk[] = baseChunks.map((chunk) => ({
      ...chunk,
      enriched_text: undefined,
      extracted_entities: undefined,
      relationship_ids: [],
      context_expansion_level: 0, // No enrichment
    }));

    return enhancedChunks;
  }

  /**
   * Store chunks to PostgreSQL chunk_metadata table
   *
   * Persists chunks with enrichment metadata to database
   */
  private async storeChunksToDatabase(chunks: EnhancedChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const startTime = Date.now();
    console.log(`[Enhanced Chunking] Storing ${chunks.length} chunks to database`);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const chunk of chunks) {
        const query = `
          INSERT INTO chunk_metadata (
            chunk_id,
            artifact_id,
            patient_id,
            artifact_type,
            chunk_text,
            enriched_text,
            extracted_entities,
            relationship_ids,
            context_expansion_level,
            char_offsets,
            occurred_at,
            author,
            source_url,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (chunk_id) DO UPDATE SET
            enriched_text = EXCLUDED.enriched_text,
            extracted_entities = EXCLUDED.extracted_entities,
            relationship_ids = EXCLUDED.relationship_ids,
            context_expansion_level = EXCLUDED.context_expansion_level
        `;

        const values = [
          chunk.chunk_id,
          chunk.artifact_id,
          chunk.patient_id,
          chunk.artifact_type,
          chunk.chunk_text,
          chunk.enriched_text || null,
          chunk.extracted_entities ? JSON.stringify(chunk.extracted_entities) : null,
          chunk.relationship_ids || [],
          chunk.context_expansion_level || 0,
          [chunk.char_offsets[0], chunk.char_offsets[1]], // PostgreSQL integer array
          chunk.occurred_at,
          chunk.author || null,
          chunk.source_url || null,
          chunk.created_at,
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      console.log(`[Enhanced Chunking] ✓ Stored ${chunks.length} chunks (${duration}ms)`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Enhanced Chunking] Failed to store chunks:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get chunks by patient ID from database
   *
   * Retrieves chunks with enrichment metadata from PostgreSQL
   */
  async getChunksByPatient(patientId: string): Promise<EnhancedChunk[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM chunk_metadata
        WHERE patient_id = $1
        ORDER BY occurred_at DESC
      `;

      const result = await client.query(query, [patientId]);

      return result.rows.map((row) => this.rowToEnhancedChunk(row));
    } finally {
      client.release();
    }
  }

  /**
   * Get chunks by artifact ID from database
   */
  async getChunksByArtifact(artifactId: string): Promise<EnhancedChunk[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM chunk_metadata
        WHERE artifact_id = $1
        ORDER BY char_offsets ASC
      `;

      const result = await client.query(query, [artifactId]);

      return result.rows.map((row) => this.rowToEnhancedChunk(row));
    } finally {
      client.release();
    }
  }

  /**
   * Get enriched chunks only
   *
   * Returns only chunks that have enriched_text
   */
  async getEnrichedChunks(patientId: string): Promise<EnhancedChunk[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM chunk_metadata
        WHERE patient_id = $1 AND enriched_text IS NOT NULL
        ORDER BY occurred_at DESC
      `;

      const result = await client.query(query, [patientId]);

      return result.rows.map((row) => this.rowToEnhancedChunk(row));
    } finally {
      client.release();
    }
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(patientId?: string): Promise<{
    total_chunks: number;
    enriched_chunks: number;
    original_chunks: number;
    enrichment_percentage: number;
    avg_relationships_per_chunk: number;
  }> {
    const client = await this.pool.connect();

    try {
      const whereClause = patientId ? 'WHERE patient_id = $1' : '';
      const params = patientId ? [patientId] : [];

      const query = `
        SELECT
          COUNT(*) as total_chunks,
          COUNT(enriched_text) as enriched_chunks,
          COUNT(*) - COUNT(enriched_text) as original_chunks,
          AVG(ARRAY_LENGTH(relationship_ids, 1)) as avg_relationships
        FROM chunk_metadata
        ${whereClause}
      `;

      const result = await client.query(query, params);
      const row = result.rows[0];

      const totalChunks = parseInt(row.total_chunks || '0');
      const enrichedChunks = parseInt(row.enriched_chunks || '0');
      const originalChunks = parseInt(row.original_chunks || '0');
      const avgRelationships = parseFloat(row.avg_relationships || '0');

      return {
        total_chunks: totalChunks,
        enriched_chunks: enrichedChunks,
        original_chunks: originalChunks,
        enrichment_percentage:
          totalChunks > 0 ? (enrichedChunks / totalChunks) * 100 : 0,
        avg_relationships_per_chunk: avgRelationships,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Convert database row to EnhancedChunk
   */
  private rowToEnhancedChunk(row: any): EnhancedChunk {
    // PostgreSQL returns integer[] as array
    const charOffsets: [number, number] = Array.isArray(row.char_offsets)
      ? [row.char_offsets[0], row.char_offsets[1]]
      : [0, 0];

    return {
      chunk_id: row.chunk_id,
      artifact_id: row.artifact_id,
      patient_id: row.patient_id,
      artifact_type: row.artifact_type,
      chunk_text: row.chunk_text,
      enriched_text: row.enriched_text,
      extracted_entities: row.extracted_entities,
      relationship_ids: row.relationship_ids || [],
      context_expansion_level: row.context_expansion_level || 0,
      char_offsets: charOffsets,
      occurred_at: row.occurred_at,
      author: row.author,
      source_url: row.source_url,
      created_at: row.created_at,
    };
  }

  /**
   * Close database pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Enhanced Chunking] Database pool closed');
  }
}

export const enhancedChunkingService = new EnhancedChunkingService();
export default enhancedChunkingService;
