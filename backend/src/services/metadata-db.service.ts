/**
 * Metadata Database Service
 * PostgreSQL-based metadata storage for temporal filtering and chunk retrieval
 *
 * Features:
 * - Connection pooling (10-20 connections)
 * - Batch chunk insertion
 * - Date range filtering
 * - Artifact type filtering
 * - Individual chunk retrieval
 * - Efficient indexed queries
 */

import { Pool, PoolConfig } from 'pg';

/**
 * Database configuration interface
 */
export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;              // Maximum pool size (default: 20)
  idleTimeoutMillis?: number; // Idle timeout (default: 30000ms)
  connectionTimeoutMillis?: number; // Connection timeout (default: 10000ms)
}

/**
 * Chunk metadata interface
 */
export interface Chunk {
  chunk_id: string;
  artifact_id: string;
  patient_id: string;
  artifact_type: string;
  occurred_at: string | Date; // ISO 8601 timestamp or Date object
  author?: string;
  chunk_text: string;
  char_offsets?: number[];
  source_url?: string;
}

/**
 * Filter options for querying chunks
 */
export interface FilterOptions {
  patientId: string;
  fromDate?: string;  // ISO 8601 format
  toDate?: string;    // ISO 8601 format
  types?: string[];   // Artifact types
  limit?: number;     // Maximum number of results
  offset?: number;    // Pagination offset
}

/**
 * Metadata Database Class
 * Manages PostgreSQL connection pool and metadata operations
 */
class MetadataDB {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to PostgreSQL database with connection pooling
   * @param config - Database configuration
   */
  async connect(config: DBConfig): Promise<void> {
    if (this.isConnected && this.pool) {
      console.log('[MetadataDB] Already connected to database');
      return;
    }

    try {
      console.log('[MetadataDB] Connecting to PostgreSQL database');
      console.log(`  Host: ${config.host}:${config.port}`);
      console.log(`  Database: ${config.database}`);
      console.log(`  User: ${config.user}`);

      const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        max: config.max || 20,                           // Default: 20 connections
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,    // Default: 30 seconds
        connectionTimeoutMillis: config.connectionTimeoutMillis || 10000, // Default: 10 seconds
      };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;

      console.log('[MetadataDB] ✓ Connection successful');
      console.log(`  Server time: ${result.rows[0].now}`);
      console.log(`  Pool size: ${poolConfig.max}`);
      console.log(`  Idle timeout: ${poolConfig.idleTimeoutMillis}ms`);
      console.log(`  Connection timeout: ${poolConfig.connectionTimeoutMillis}ms\n`);
    } catch (error) {
      console.error('[MetadataDB] Connection failed:', error);
      throw new Error(
        `Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from database and close connection pool
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      console.log('[MetadataDB] Closing connection pool');
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('[MetadataDB] ✓ Disconnected\n');
    } catch (error) {
      console.error('[MetadataDB] Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Insert multiple chunks into the database (batch operation)
   * Uses a single transaction for atomicity
   * @param chunks - Array of chunk metadata objects
   */
  async insertChunks(chunks: Chunk[]): Promise<void> {
    this.ensureConnected();

    if (chunks.length === 0) {
      console.warn('[MetadataDB] No chunks to insert');
      return;
    }

    const client = await this.pool!.connect();

    try {
      console.log(`[MetadataDB] Inserting ${chunks.length} chunks (batch operation)`);

      await client.query('BEGIN');

      const startTime = Date.now();

      // Build parameterized query for batch insert
      // Using ON CONFLICT DO NOTHING to handle duplicate chunk_ids gracefully
      const query = `
        INSERT INTO chunk_metadata (
          chunk_id, artifact_id, patient_id, artifact_type, occurred_at,
          author, chunk_text, char_offsets, source_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (chunk_id) DO NOTHING
      `;

      let insertedCount = 0;

      for (const chunk of chunks) {
        // Validate required fields
        this.validateChunk(chunk);

        const values = [
          chunk.chunk_id,
          chunk.artifact_id,
          chunk.patient_id,
          chunk.artifact_type,
          chunk.occurred_at,
          chunk.author || null,
          chunk.chunk_text,
          chunk.char_offsets || null,
          chunk.source_url || null,
        ];

        const result = await client.query(query, values);
        insertedCount += result.rowCount || 0;
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Inserted ${insertedCount} chunks (${duration}ms, ${Math.round(duration / chunks.length)}ms per chunk)\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[MetadataDB] Failed to insert chunks:', error);
      throw new Error(
        `Failed to insert chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Filter chunks by date range for a specific patient
   * Returns only chunk_ids for efficient vector search lookup
   * @param patientId - Patient identifier
   * @param from - Start date (ISO 8601 format)
   * @param to - End date (ISO 8601 format)
   * @returns Array of chunk IDs
   */
  async filterByDateRange(patientId: string, from: string, to: string): Promise<string[]> {
    this.ensureConnected();

    try {
      console.log(`[MetadataDB] Filtering chunks by date range`);
      console.log(`  Patient ID: ${patientId}`);
      console.log(`  Date range: ${from} to ${to}`);

      const startTime = Date.now();

      // Use indexed query for efficient date range lookup
      const query = `
        SELECT chunk_id
        FROM chunk_metadata
        WHERE patient_id = $1
          AND occurred_at >= $2
          AND occurred_at <= $3
        ORDER BY occurred_at DESC
      `;

      const result = await this.pool!.query(query, [patientId, from, to]);

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Found ${result.rows.length} chunks (${duration}ms)\n`);

      return result.rows.map((row) => row.chunk_id);
    } catch (error) {
      console.error('[MetadataDB] Date range filter failed:', error);
      throw new Error(
        `Failed to filter by date range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Filter chunks by artifact type(s) for a specific patient
   * Returns only chunk_ids for efficient vector search lookup
   * @param patientId - Patient identifier
   * @param types - Array of artifact types
   * @returns Array of chunk IDs
   */
  async filterByType(patientId: string, types: string[]): Promise<string[]> {
    this.ensureConnected();

    if (types.length === 0) {
      console.warn('[MetadataDB] No types provided for filtering');
      return [];
    }

    try {
      console.log(`[MetadataDB] Filtering chunks by type`);
      console.log(`  Patient ID: ${patientId}`);
      console.log(`  Types: ${types.join(', ')}`);

      const startTime = Date.now();

      // Use indexed query with IN clause for type filtering
      const query = `
        SELECT chunk_id
        FROM chunk_metadata
        WHERE patient_id = $1
          AND artifact_type = ANY($2)
        ORDER BY occurred_at DESC
      `;

      const result = await this.pool!.query(query, [patientId, types]);

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Found ${result.rows.length} chunks (${duration}ms)\n`);

      return result.rows.map((row) => row.chunk_id);
    } catch (error) {
      console.error('[MetadataDB] Type filter failed:', error);
      throw new Error(
        `Failed to filter by type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Filter chunks using combined criteria (date range + types)
   * More efficient than calling filterByDateRange and filterByType separately
   * @param options - Filter options
   * @returns Array of chunk IDs
   */
  async filterChunks(options: FilterOptions): Promise<string[]> {
    this.ensureConnected();

    try {
      console.log(`[MetadataDB] Filtering chunks with combined criteria`);
      console.log(`  Patient ID: ${options.patientId}`);
      if (options.fromDate) console.log(`  From date: ${options.fromDate}`);
      if (options.toDate) console.log(`  To date: ${options.toDate}`);
      if (options.types) console.log(`  Types: ${options.types.join(', ')}`);
      if (options.limit) console.log(`  Limit: ${options.limit}`);

      const startTime = Date.now();

      // Build dynamic query based on provided filters
      const conditions: string[] = ['patient_id = $1'];
      const values: any[] = [options.patientId];
      let paramIndex = 2;

      if (options.fromDate) {
        conditions.push(`occurred_at >= $${paramIndex}`);
        values.push(options.fromDate);
        paramIndex++;
      }

      if (options.toDate) {
        conditions.push(`occurred_at <= $${paramIndex}`);
        values.push(options.toDate);
        paramIndex++;
      }

      if (options.types && options.types.length > 0) {
        conditions.push(`artifact_type = ANY($${paramIndex})`);
        values.push(options.types);
        paramIndex++;
      }

      let query = `
        SELECT chunk_id
        FROM chunk_metadata
        WHERE ${conditions.join(' AND ')}
        ORDER BY occurred_at DESC
      `;

      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(options.limit);
        paramIndex++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(options.offset);
      }

      const result = await this.pool!.query(query, values);

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Found ${result.rows.length} chunks (${duration}ms)\n`);

      return result.rows.map((row) => row.chunk_id);
    } catch (error) {
      console.error('[MetadataDB] Combined filter failed:', error);
      throw new Error(
        `Failed to filter chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get full chunk metadata by chunk ID
   * @param chunkId - Chunk identifier
   * @returns Chunk object or null if not found
   */
  async getChunkById(chunkId: string): Promise<Chunk | null> {
    this.ensureConnected();

    try {
      console.log(`[MetadataDB] Retrieving chunk by ID: ${chunkId}`);

      const startTime = Date.now();

      const query = `
        SELECT *
        FROM chunk_metadata
        WHERE chunk_id = $1
      `;

      const result = await this.pool!.query(query, [chunkId]);

      const duration = Date.now() - startTime;

      if (result.rows.length === 0) {
        console.log(`[MetadataDB] Chunk not found (${duration}ms)\n`);
        return null;
      }

      console.log(`[MetadataDB] ✓ Chunk retrieved (${duration}ms)\n`);

      return this.mapRowToChunk(result.rows[0]);
    } catch (error) {
      console.error('[MetadataDB] Failed to get chunk by ID:', error);
      throw new Error(
        `Failed to get chunk: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get multiple chunks by their IDs (batch retrieval)
   * More efficient than calling getChunkById multiple times
   * @param chunkIds - Array of chunk identifiers
   * @returns Array of chunk objects
   */
  async getChunksByIds(chunkIds: string[]): Promise<Chunk[]> {
    this.ensureConnected();

    if (chunkIds.length === 0) {
      return [];
    }

    try {
      console.log(`[MetadataDB] Retrieving ${chunkIds.length} chunks by ID (batch)`);

      const startTime = Date.now();

      const query = `
        SELECT *
        FROM chunk_metadata
        WHERE chunk_id = ANY($1)
      `;

      const result = await this.pool!.query(query, [chunkIds]);

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Retrieved ${result.rows.length} chunks (${duration}ms)\n`);

      return result.rows.map((row) => this.mapRowToChunk(row));
    } catch (error) {
      console.error('[MetadataDB] Failed to get chunks by IDs:', error);
      throw new Error(
        `Failed to get chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete chunks by chunk IDs
   * @param chunkIds - Array of chunk identifiers to delete
   * @returns Number of deleted chunks
   */
  async deleteChunks(chunkIds: string[]): Promise<number> {
    this.ensureConnected();

    if (chunkIds.length === 0) {
      return 0;
    }

    try {
      console.log(`[MetadataDB] Deleting ${chunkIds.length} chunks`);

      const startTime = Date.now();

      const query = `
        DELETE FROM chunk_metadata
        WHERE chunk_id = ANY($1)
      `;

      const result = await this.pool!.query(query, [chunkIds]);

      const duration = Date.now() - startTime;
      const deletedCount = result.rowCount || 0;
      console.log(`[MetadataDB] ✓ Deleted ${deletedCount} chunks (${duration}ms)\n`);

      return deletedCount;
    } catch (error) {
      console.error('[MetadataDB] Failed to delete chunks:', error);
      throw new Error(
        `Failed to delete chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalChunks: number;
    uniquePatients: number;
    uniqueArtifacts: number;
    artifactTypes: { type: string; count: number }[];
  }> {
    this.ensureConnected();

    try {
      console.log('[MetadataDB] Retrieving database statistics');

      const startTime = Date.now();

      // Total chunks
      const totalResult = await this.pool!.query('SELECT COUNT(*) FROM chunk_metadata');
      const totalChunks = parseInt(totalResult.rows[0].count, 10);

      // Unique patients
      const patientsResult = await this.pool!.query(
        'SELECT COUNT(DISTINCT patient_id) FROM chunk_metadata'
      );
      const uniquePatients = parseInt(patientsResult.rows[0].count, 10);

      // Unique artifacts
      const artifactsResult = await this.pool!.query(
        'SELECT COUNT(DISTINCT artifact_id) FROM chunk_metadata'
      );
      const uniqueArtifacts = parseInt(artifactsResult.rows[0].count, 10);

      // Artifact types distribution
      const typesResult = await this.pool!.query(`
        SELECT artifact_type AS type, COUNT(*) AS count
        FROM chunk_metadata
        GROUP BY artifact_type
        ORDER BY count DESC
      `);
      const artifactTypes = typesResult.rows.map((row) => ({
        type: row.type,
        count: parseInt(row.count, 10),
      }));

      const duration = Date.now() - startTime;
      console.log(`[MetadataDB] ✓ Statistics retrieved (${duration}ms)\n`);

      return {
        totalChunks,
        uniquePatients,
        uniqueArtifacts,
        artifactTypes,
      };
    } catch (error) {
      console.error('[MetadataDB] Failed to get statistics:', error);
      throw new Error(
        `Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate chunk has required fields
   */
  private validateChunk(chunk: Chunk): void {
    if (!chunk.chunk_id) {
      throw new Error('Chunk validation failed: chunk_id is required');
    }
    if (!chunk.artifact_id) {
      throw new Error('Chunk validation failed: artifact_id is required');
    }
    if (!chunk.patient_id) {
      throw new Error('Chunk validation failed: patient_id is required');
    }
    if (!chunk.artifact_type) {
      throw new Error('Chunk validation failed: artifact_type is required');
    }
    if (!chunk.occurred_at) {
      throw new Error('Chunk validation failed: occurred_at is required');
    }
    if (!chunk.chunk_text) {
      throw new Error('Chunk validation failed: chunk_text is required');
    }
  }

  /**
   * Map database row to Chunk object
   */
  private mapRowToChunk(row: any): Chunk {
    return {
      chunk_id: row.chunk_id,
      artifact_id: row.artifact_id,
      patient_id: row.patient_id,
      artifact_type: row.artifact_type,
      occurred_at: row.occurred_at,
      author: row.author,
      chunk_text: row.chunk_text,
      char_offsets: row.char_offsets,
      source_url: row.source_url,
    };
  }

  /**
   * Ensure database connection is established
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}

// Export singleton instance
export const metadataDB = new MetadataDB();
export default metadataDB;
