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
/**
 * Database configuration interface
 */
export interface DBConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
/**
 * Chunk metadata interface
 */
export interface Chunk {
    chunk_id: string;
    artifact_id: string;
    patient_id: string;
    artifact_type: string;
    occurred_at: string | Date;
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
    fromDate?: string;
    toDate?: string;
    types?: string[];
    limit?: number;
    offset?: number;
}
/**
 * Metadata Database Class
 * Manages PostgreSQL connection pool and metadata operations
 */
declare class MetadataDB {
    private pool;
    private isConnected;
    /**
     * Connect to PostgreSQL database with connection pooling
     * @param config - Database configuration
     */
    connect(config: DBConfig): Promise<void>;
    /**
     * Disconnect from database and close connection pool
     */
    disconnect(): Promise<void>;
    /**
     * Insert multiple chunks into the database (batch operation)
     * Uses a single transaction for atomicity
     * @param chunks - Array of chunk metadata objects
     */
    insertChunks(chunks: Chunk[]): Promise<void>;
    /**
     * Filter chunks by date range for a specific patient
     * Returns only chunk_ids for efficient vector search lookup
     * @param patientId - Patient identifier
     * @param from - Start date (ISO 8601 format)
     * @param to - End date (ISO 8601 format)
     * @returns Array of chunk IDs
     */
    filterByDateRange(patientId: string, from: string, to: string): Promise<string[]>;
    /**
     * Filter chunks by artifact type(s) for a specific patient
     * Returns only chunk_ids for efficient vector search lookup
     * @param patientId - Patient identifier
     * @param types - Array of artifact types
     * @returns Array of chunk IDs
     */
    filterByType(patientId: string, types: string[]): Promise<string[]>;
    /**
     * Filter chunks using combined criteria (date range + types)
     * More efficient than calling filterByDateRange and filterByType separately
     * @param options - Filter options
     * @returns Array of chunk IDs
     */
    filterChunks(options: FilterOptions): Promise<string[]>;
    /**
     * Get full chunk metadata by chunk ID
     * @param chunkId - Chunk identifier
     * @returns Chunk object or null if not found
     */
    getChunkById(chunkId: string): Promise<Chunk | null>;
    /**
     * Get multiple chunks by their IDs (batch retrieval)
     * More efficient than calling getChunkById multiple times
     * @param chunkIds - Array of chunk identifiers
     * @returns Array of chunk objects
     */
    getChunksByIds(chunkIds: string[]): Promise<Chunk[]>;
    /**
     * Delete chunks by chunk IDs
     * @param chunkIds - Array of chunk identifiers to delete
     * @returns Number of deleted chunks
     */
    deleteChunks(chunkIds: string[]): Promise<number>;
    /**
     * Get database statistics
     */
    getStats(): Promise<{
        totalChunks: number;
        uniquePatients: number;
        uniqueArtifacts: number;
        artifactTypes: {
            type: string;
            count: number;
        }[];
    }>;
    /**
     * Validate chunk has required fields
     */
    private validateChunk;
    /**
     * Map database row to Chunk object
     */
    private mapRowToChunk;
    /**
     * Ensure database connection is established
     */
    private ensureConnected;
}
export declare const metadataDB: MetadataDB;
export default metadataDB;
//# sourceMappingURL=metadata-db.service.d.ts.map