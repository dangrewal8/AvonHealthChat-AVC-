/**
 * Chunk Store Service
 *
 * Storage and metadata management for parsed chunks.
 *
 * Requirements:
 * - In-memory Map storage for demo
 * - Multiple indexes for efficient retrieval
 * - Query filtering by multiple criteria
 * - Cleanup and garbage collection
 *
 */
import { ParsedChunk, ChunkFilter, StorageStatistics, StoreResult } from '../types/parsed-chunk.types';
/**
 * Chunk Store Class
 *
 * Manages storage and retrieval of parsed chunks with efficient indexing
 */
declare class ChunkStore {
    /**
     * Primary storage: chunk_id -> ParsedChunk
     */
    private chunks;
    /**
     * Index: artifact_id -> Set<chunk_id>
     */
    private artifactIndex;
    /**
     * Index: patient_id -> Set<chunk_id>
     */
    private patientIndex;
    /**
     * Index: date (YYYY-MM-DD) -> Set<chunk_id>
     */
    private dateIndex;
    /**
     * Store chunks
     *
     * Store parsed chunks with automatic indexing
     *
     * @param chunks - Chunks to store
     * @returns Store result with statistics
     */
    store(chunks: ParsedChunk[]): Promise<StoreResult>;
    /**
     * Retrieve chunk by ID
     *
     * Get single chunk by chunk_id
     *
     * @param chunkId - Chunk ID to retrieve
     * @returns Chunk or null if not found
     */
    retrieve(chunkId: string): Promise<ParsedChunk | null>;
    /**
     * Query chunks with filters
     *
     * Filter chunks by multiple criteria
     *
     * @param filters - Filter criteria
     * @returns Matching chunks
     */
    query(filters?: ChunkFilter): Promise<ParsedChunk[]>;
    /**
     * Get chunks by patient
     *
     * Retrieve all chunks for a patient
     *
     * @param patientId - Patient ID
     * @returns Array of chunks
     */
    getByPatient(patientId: string): Promise<ParsedChunk[]>;
    /**
     * Get chunks by artifact
     *
     * Retrieve all chunks for an artifact
     *
     * @param artifactId - Artifact ID
     * @returns Array of chunks
     */
    getByArtifact(artifactId: string): Promise<ParsedChunk[]>;
    /**
     * Delete chunk by ID
     *
     * Remove chunk and update indexes
     *
     * @param chunkId - Chunk ID to delete
     * @returns True if deleted, false if not found
     */
    delete(chunkId: string): Promise<boolean>;
    /**
     * Delete chunks by patient
     *
     * Remove all chunks for a patient
     *
     * @param patientId - Patient ID
     * @returns Number of chunks deleted
     */
    deleteByPatient(patientId: string): Promise<number>;
    /**
     * Delete chunks by artifact
     *
     * Remove all chunks for an artifact
     *
     * @param artifactId - Artifact ID
     * @returns Number of chunks deleted
     */
    deleteByArtifact(artifactId: string): Promise<number>;
    /**
     * Clear all chunks
     *
     * Remove all stored chunks and reset indexes
     *
     * @returns Number of chunks cleared
     */
    clear(): Promise<number>;
    /**
     * Garbage collection
     *
     * Remove chunks older than specified date
     *
     * @param olderThan - ISO 8601 date - remove chunks before this date
     * @returns Number of chunks removed
     */
    garbageCollect(olderThan: string): Promise<number>;
    /**
     * Get storage statistics
     *
     * Calculate statistics about stored chunks
     *
     * @returns Storage statistics
     */
    getStatistics(): Promise<StorageStatistics>;
    /**
     * Count chunks
     *
     * Get total number of stored chunks
     *
     * @returns Chunk count
     */
    count(): number;
    /**
     * Has chunk
     *
     * Check if chunk exists
     *
     * @param chunkId - Chunk ID to check
     * @returns True if exists
     */
    has(chunkId: string): boolean;
    /**
     * Update indexes
     *
     * Add chunk to all indexes
     *
     * @param chunk - Chunk to index
     */
    private updateIndexes;
    /**
     * Remove from indexes
     *
     * Remove chunk from all indexes
     *
     * @param chunk - Chunk to remove
     */
    private removeFromIndexes;
    /**
     * Get chunks in date range
     *
     * Query by date range using date index
     *
     * @param dateFrom - Start date (inclusive)
     * @param dateTo - End date (inclusive)
     * @returns Set of chunk IDs
     */
    private getChunksInDateRange;
    /**
     * Intersect two sets
     *
     * Return intersection of two sets
     *
     * @param setA - First set
     * @param setB - Second set
     * @returns Intersection
     */
    private intersect;
    /**
     * Validate chunk
     *
     * Ensure chunk has required fields
     *
     * @param chunk - Chunk to validate
     * @throws Error if invalid
     */
    private validateChunk;
    /**
     * Estimate memory usage
     *
     * Rough estimate of memory used by stored chunks
     *
     * @returns Estimated bytes
     */
    private estimateMemoryUsage;
    /**
     * Explain Chunk Store
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const chunkStore: ChunkStore;
export default chunkStore;
//# sourceMappingURL=chunk-store.service.d.ts.map