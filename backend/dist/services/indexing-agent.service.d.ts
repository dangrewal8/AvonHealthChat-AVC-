/**
 * Indexing Agent Service
 *
 * Orchestrates the complete embedding and indexing pipeline:
 * - Chunk-level embeddings for broad retrieval
 * - Sentence-level embeddings for precise citations
 * - Keyword indexing for hybrid search
 * - Metadata storage for filtering
 * - Progress tracking and error recovery
 */
/**
 * Chunk interface for indexing
 */
export interface Chunk {
    chunk_id: string;
    artifact_id: string;
    text: string;
    chunk_index: number;
    absolute_offset: number;
    metadata?: {
        patient_id?: string;
        artifact_type?: string;
        occurred_at?: string;
        author?: string;
        source_url?: string;
    };
}
/**
 * Result of indexing operation
 */
export interface IndexingResult {
    success: boolean;
    chunksIndexed: number;
    sentencesIndexed: number;
    chunkEmbeddingsGenerated: number;
    sentenceEmbeddingsGenerated: number;
    errors: Array<{
        chunk_id: string;
        error: string;
    }>;
    duration: number;
}
/**
 * Index statistics
 */
export interface IndexStats {
    totalChunks: number;
    totalSentences: number;
    totalChunkEmbeddings: number;
    totalSentenceEmbeddings: number;
    patients: number;
    artifacts: number;
    artifactTypes: string[];
    dateRange: {
        earliest: string | null;
        latest: string | null;
    };
    indexSize: {
        vectorStore: string;
        metadata: string;
    };
}
/**
 * Progress tracking for indexing operations
 */
export interface IndexingProgress {
    stage: 'extracting' | 'embedding_chunks' | 'embedding_sentences' | 'storing' | 'indexing_keywords' | 'complete';
    chunksProcessed: number;
    chunksTotal: number;
    sentencesProcessed: number;
    sentencesTotal: number;
    percentComplete: number;
    currentChunk?: string;
    error?: string;
}
/**
 * Progress callback function
 */
export type ProgressCallback = (progress: IndexingProgress) => void;
/**
 * Indexing Agent
 *
 * Orchestrates the complete embedding and indexing pipeline
 */
declare class IndexingAgent {
    private metadataCache;
    private isInitialized;
    constructor();
    /**
     * Initialize the indexing agent
     */
    initialize(): Promise<void>;
    /**
     * Index chunks with chunk-level and sentence-level embeddings
     *
     * Pipeline:
     * 1. Extract text from chunks
     * 2. Generate chunk-level embeddings (batch)
     * 3. Segment into sentences and generate sentence-level embeddings (batch)
     * 4. Store in FAISS vector store
     * 5. Store metadata in PostgreSQL
     * 6. Build keyword index for hybrid search
     * 7. Update in-memory metadata cache
     *
     * @param chunks - Array of chunks to index
     * @param onProgress - Optional progress callback
     * @returns IndexingResult
     */
    indexChunks(chunks: Chunk[], onProgress?: ProgressCallback): Promise<IndexingResult>;
    /**
     * Reindex an entire artifact
     *
     * Retrieves all chunks for the artifact and reindexes them
     *
     * @param artifactId - Artifact ID to reindex
     * @param onProgress - Optional progress callback
     */
    reindexArtifact(artifactId: string, onProgress?: ProgressCallback): Promise<IndexingResult>;
    /**
     * Clear the entire index
     *
     * Removes all vectors, metadata, and cache
     */
    clearIndex(): Promise<void>;
    /**
     * Get index statistics
     *
     * @returns IndexStats
     */
    getIndexStats(): Promise<IndexStats>;
    /**
     * Get chunks by filter criteria
     *
     * Uses in-memory cache for fast filtering
     *
     * @param filters - Filter criteria
     * @returns Array of chunk IDs
     */
    getChunksByFilter(filters: {
        patientId?: string;
        artifactId?: string;
        artifactType?: string;
        date?: string;
    }): string[];
    /**
     * Get chunk metadata by ID
     *
     * @param chunkId - Chunk ID
     * @returns Chunk metadata or undefined
     */
    getChunkMetadata(chunkId: string): Chunk | undefined;
    /**
     * Update in-memory metadata cache
     *
     * @param chunks - Chunks to add to cache
     */
    private updateMetadataCache;
    /**
     * Remove chunk from cache
     *
     * @param chunkId - Chunk ID to remove
     */
    private removeFromCache;
    /**
     * Report progress to callback
     *
     * @param callback - Progress callback function
     * @param progress - Progress information
     */
    private reportProgress;
    /**
     * Format bytes to human-readable string
     *
     * @param bytes - Number of bytes
     * @returns Formatted string (e.g., "10.5 MB")
     */
    private formatBytes;
}
declare const indexingAgent: IndexingAgent;
export default indexingAgent;
//# sourceMappingURL=indexing-agent.service.d.ts.map